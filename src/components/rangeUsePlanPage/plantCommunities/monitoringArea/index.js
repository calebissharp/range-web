import React, { useState } from 'react'
import PropTypes from 'prop-types'
import MonitoringAreaRow from './MonitoringAreaBox'
import { FieldArray } from 'formik'
import AddMonitoringAreaButton from './AddMonitoringAreaButton'
import InputModal from '../../../common/InputModal'

const MonitoringAreaList = ({ monitoringAreas, namespace }) => {
  const [areaToCopy, setAreaToCopy] = useState()

  return (
    <div className="rup__plant-community__m-areas">
      <FieldArray
        name={namespace}
        render={({ push, remove }) => (
          <>
            <AddMonitoringAreaButton
              onClick={() => {
                setAreaToCopy({
                  rangelandHealth: 0,
                  purposes: [],
                  location: '',
                  latitute: 0,
                  longtitude: 0,
                  transect_azimuth: 0,
                  other_purpose: ''
                })
              }}
            />
            {monitoringAreas.length === 0 && <div>No monitoring area</div>}
            {monitoringAreas.map((monitoringArea, index) => (
              <MonitoringAreaRow
                key={monitoringArea.id}
                monitoringArea={monitoringArea}
                namespace={`${namespace}.${index}`}
                onRemove={() => remove(index)}
                onCopy={() => setAreaToCopy(monitoringArea)}
              />
            ))}

            <InputModal
              open={areaToCopy}
              onSubmit={name => {
                setAreaToCopy()
                push({
                  ...areaToCopy,
                  name
                })
              }}
              onClose={() => setAreaToCopy()}
              title="Monitoring Area Name"
            />
          </>
        )}
      />
    </div>
  )
}

MonitoringAreaList.propTypes = {
  monitoringAreas: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  namespace: PropTypes.string.isRequired
}

export default MonitoringAreaList
