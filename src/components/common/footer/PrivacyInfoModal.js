import React, { useState, useEffect } from 'react'
import { Modal } from 'semantic-ui-react'
import { PrimaryButton } from '../index'
import { APP_NAME } from '../../../constants/strings'
import { useUser } from '../../../providers/UserProvider'

const PrivacyInfoModal = () => {
  const user = useUser()

  const [isOpen, setOpen] = useState(false)

  const closeModal = () => {
    setOpen(false)
    window.localStorage.setItem(
      'range-web-user',
      JSON.stringify({ ...user, piaSeen: true })
    )
  }

  useEffect(() => {
    if (user) {
      setOpen(!user.piaSeen)
    }
  }, [user])

  return (
    <Modal
      dimmer="blurring"
      closeIcon
      onClose={closeModal}
      open={isOpen}
      size="small">
      <Modal.Content>
        <div className="privacy-info">
          <div className="privacy-info__title">Privacy Information</div>
          <div className="privacy-info__sub-title">
            Please review to return to {APP_NAME}
          </div>
          <div>
            <div>
              Personal information is collected under the legal authority of
              section 26 (c) and 27 (1)(a)(i) of the Freedom of Information and
              Protection of Privacy Act (the Act). The collection, use, and
              disclosure of personal information is subject to the provisions of
              the Act. The personal information collected will be used to
              process your submission(s). It may also be shared when strictly
              necessary with partner agencies that are also subject to the
              provisions of the Act. The personal information supplied in the
              submission may be used for referrals, consultation, or
              notifications as required. Staff may use your personal information
              to contact you regarding your submission or for survey purposes.
            </div>
            <div className="privacy-info__space" />
            <div>
              For more information regarding the collection, use, and/or
              disclosure of your personal information, please contact MyRangeBC
              Administrator at:
            </div>
            <div className="privacy-info__space" />
            <div>Email: myrangebc@gov.bc.ca</div>
            <div className="privacy-info__space" />
            <div>Telephone: 250 371-3827</div>
            <div className="privacy-info__space" />
            <div>Mailing Address:</div>
            <div>
              <b>
                Ministry of Forests, Lands, Natural Resource Operations and
                Rural Development
              </b>
            </div>
            <div>Range Branch - Kamloops</div>
            <div>Attn: MyRangeBC</div>
            <div>441 Columbia Street</div>
            <div>Kamloops, BC</div>
            <div>V2C 2T3</div>
          </div>
          <a
            className="privacy-info__gov-link"
            href="https://www2.gov.bc.ca/gov/content/home/privacy"
            target="_blank"
            rel="noopener noreferrer">
            Open B.C. Government Website Privacy
          </a>
        </div>
        <div className="privacy-info__continue-btn">
          <PrimaryButton
            content={`Continue to ${APP_NAME}`}
            onClick={closeModal}
          />
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default PrivacyInfoModal
