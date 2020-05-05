import uuid from 'uuid-v4'
import {
  axios,
  getAuthHeaderConfig,
  findStatusWithCode,
  isStatusApproved,
  isStatusStands,
  isStatusStandsWM
} from '../utils'
import * as API from '../constants/api'
import RUPSchema from '../components/rangeUsePlanPage/schema'
import { getNetworkStatus } from '../utils/helper/network'
import { deleteFromQueue } from './delete'
import {
  saveGrazingSchedules,
  saveInvasivePlantChecklist,
  saveManagementConsiderations,
  saveMinisterIssues,
  saveAdditionalRequirements,
  savePlantCommunities,
  savePastures
} from '.'
import {
  REFERENCE_KEY,
  AMENDMENT_TYPE,
  PLAN_STATUS
} from '../constants/variables'

/**
 * Syncs plan and then returns locally stored record
 * @param {number} planId
 */
export const getPlan = async planId => {
  if (!uuid.isUUID(planId)) {
    await syncPlan(planId)
  }
  const plan = getPlanFromLocalStorage(planId)

  return plan
}

/**
 * If online, first updates any unsynced plan changes and then fetches and then
 * stores the latest version of the plan into local storage
 * @param {number} planId
 * @returns {void}
 */

const syncPlan = async planId => {
  const isOnline = await getNetworkStatus()
  const localPlan = getPlanFromLocalStorage(planId)

  if (isOnline) {
    if (localPlan && !localPlan.synced) {
      console.log(localPlan)

      await savePlan(localPlan)
    }

    const { data: serverPlan } = await axios.get(
      API.GET_RUP(planId),
      getAuthHeaderConfig()
    )
    savePlanToLocalStorage(serverPlan, true)
  }
}

/**
 * If online, uploads the plan to the API. Otherwise, saves the plan to local storage
 * @param {object} plan
 */
export const savePlan = async plan => {
  const isOnline = await getNetworkStatus()

  if (!isOnline) {
    savePlanToLocalStorage(plan, false)
    return plan.id
  }

  await deleteFromQueue()

  const {
    pastures,
    grazingSchedules,
    invasivePlantChecklist,
    managementConsiderations,
    ministerIssues,
    additionalRequirements
  } = RUPSchema.cast(plan)

  const config = getAuthHeaderConfig()

  let planId = plan.id

  if (uuid.isUUID(planId)) {
    const { id, ...planData } = plan
    const { data } = await axios.post(API.CREATE_RUP, planData, config)
    removePlanFromLocalStorage(planId)
    planId = data.id
  } else {
    await axios.put(API.UPDATE_RUP(plan.id), plan, config)
  }

  const newPastures = await savePastures(planId, pastures)

  await Promise.all(
    newPastures.map(async pasture => {
      await savePlantCommunities(planId, pasture.id, pasture.plantCommunities)
    })
  )

  await saveGrazingSchedules(planId, grazingSchedules, newPastures)
  await saveInvasivePlantChecklist(planId, invasivePlantChecklist)
  await saveManagementConsiderations(planId, managementConsiderations)
  await saveMinisterIssues(planId, ministerIssues, newPastures)
  await saveAdditionalRequirements(planId, additionalRequirements)

  return planId
}

/**
 * Saves the plan to local storage, with the key corresponding to its id
 * @param {object} plan -
 * @param {boolean} synced - If the stored plan is to be marked as synced
 */
export const savePlanToLocalStorage = (plan, synced = false) => {
  localStorage.setItem(`plan-${plan.id}`, JSON.stringify({ ...plan, synced }))
}

/**
 * Get a plan from local storage
 * @param {number} planId - ID of the plan
 */
export const getPlanFromLocalStorage = planId => {
  return JSON.parse(localStorage.getItem(`plan-${planId}`))
}

export const removePlanFromLocalStorage = planId => {
  localStorage.removeItem(`plan-${planId}`)
}

export const getLocalPlansForAgreement = agreementId => {
  const plans = Object.entries(localStorage)
    .filter(([key]) => isPlanLocal({ id: key }))
    .map(entry => JSON.parse(entry[1]))
    .filter(plan => plan.agreementId === agreementId)

  return plans
}

export const getLocalPlans = () =>
  Object.entries(localStorage)
    .filter(([key]) => {
      const res = /(plan-)(.*)/g.exec(key)
      return res && uuid.isUUID(res[2])
    })
    .map(entry => JSON.parse(entry[1]))

export const isPlanLocal = plan => {
  return uuid.isUUID(plan && plan.id)
}

export const getPlans = () =>
  Object.entries(localStorage)
    .filter(([key]) => key.match(/(plan-)(.*)/g))
    .map(entry => JSON.parse(entry[1]))

export const createNewPlan = agreement => {
  const newPlan = {
    id: uuid(),
    agreementId: agreement.id,
    rangeName: '',
    statusId: 6,
    status: { code: PLAN_STATUS.STAFF_DRAFT },
    agreement,
    planStatusHistory: [],
    pastures: [],
    ministerIssues: [],
    invasivePlantChecklist: {
      beginInUninfestedArea: false,
      equipmentAndVehiclesParking: false,
      other: null,
      revegetate: false,
      undercarrigesInspected: false
    },
    grazingSchedules: [],
    managementConsiderations: [],
    additionalRequirements: [],
    uploaded: true
  }

  savePlanToLocalStorage(newPlan)

  return newPlan
}

export const updatePlan = async (planId, data) => {
  return await axios.put(API.UPDATE_RUP(planId), data, getAuthHeaderConfig())
}

export const createAmendment = async (
  plan,
  references,
  staffInitiated = false
) => {
  const amendmentTypes = references[REFERENCE_KEY.AMENDMENT_TYPE]
  const initialAmendment = amendmentTypes.find(
    at => at.code === AMENDMENT_TYPE.INITIAL
  )
  const createdStatus = findStatusWithCode(references, PLAN_STATUS.CREATED)
  const staffDraftStatus = findStatusWithCode(
    references,
    PLAN_STATUS.STAFF_DRAFT
  )

  await axios.put(
    API.UPDATE_RUP(plan.id),
    {
      ...plan,
      amendmentTypeId: initialAmendment.id,
      staffInitiated
    },
    getAuthHeaderConfig()
  )

  await axios.put(
    API.UPDATE_PLAN_STATUS(plan.id),
    { statusId: staffInitiated ? staffDraftStatus.id : createdStatus.id },
    getAuthHeaderConfig()
  )

  return getPlan(plan.id)
}

export const updateStatus = async ({ planId, note, statusId }) => {
  await axios.put(
    API.UPDATE_PLAN_STATUS(planId),
    { note, statusId },
    getAuthHeaderConfig()
  )
}

export const updateConfirmation = async ({
  planId,
  confirmationId,
  confirmed
}) => {
  return axios.put(
    API.UPDATE_CONFIRMATION(planId, confirmationId),
    { confirmed },
    getAuthHeaderConfig()
  )
}

export const getMostRecentLegalPlan = async planId => {
  const {
    data: { versions }
  } = await axios.get(API.GET_RUP_VERSIONS(planId), getAuthHeaderConfig())

  const legalVersion = versions
    .filter(
      plan =>
        isStatusApproved(plan.status) ||
        isStatusStands(plan.status) ||
        isStatusStandsWM(plan.status)
    )
    .map(plan => ({ ...plan, createdAt: new Date(plan.createdAt) }))
    .reduce(
      (mostRecent, plan) =>
        mostRecent.createdAt && mostRecent.createdAt > plan.createdAt
          ? mostRecent
          : plan,
      {}
    )

  const { data } = await axios.get(
    API.GET_RUP_VERSION(planId, legalVersion.version),
    getAuthHeaderConfig()
  )

  return data
}

export const discardAmendment = async planId => {
  const { version } = await getMostRecentLegalPlan(planId)

  return axios.post(
    API.RESTORE_RUP_VERSION(planId, version),
    {},
    getAuthHeaderConfig()
  )
}
