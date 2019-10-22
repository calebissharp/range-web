import React from 'react'
import { Page, Text, StyleSheet } from '@react-pdf/renderer'
import Footer from './Footer'
import moment from 'moment'
import Header from './Header'
import Title from './common/Title'
import Field from './common/Field'
import Line from './common/Line'
import { config } from './common/config'
import {
  getAgreementType,
  getDistrict,
  getUserFullName,
  getAgreementExemptionStatus,
  getClientFullName,
  getContactRole
} from '../../pdf/helper'
import Row from './common/Row'
import SectionHeader from './common/SectionHeader'
import PlantCommunity from './PlantCommunity'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingTop: 70,
    fontFamily: config.fontFamily,
    fontSize: config.normalFontSize
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%'
  },
  section: {
    flex: 1
  },
  sectionHeader: {
    fontSize: config.sectionTitleFontSize,
    fontWeight: 'bold',
    margin: '5px 0',
    flex: 1
  }
})

const Pasture = ({ plan, pasture }) => (
  <>
    <Row>
      <SectionHeader>Pasture: {pasture.name}</SectionHeader>
    </Row>

    <Row>
      <Field label="Allowable AUMs">{pasture.allowableAum}</Field>
      <Field label="Private Land Deduction">
        {pasture.pldPercent && `${pasture.pldPercent * 100}%`}
      </Field>
      <Field label="Grace Days">{pasture.graceDays}</Field>
    </Row>

    <Row>
      <Field label="Pasture Notes (non legal content)">{pasture.notes}</Field>
    </Row>

    {pasture.plantCommunities.length > 0 && (
      <Row>
        <SectionHeader>Plant Communities: ({pasture.name})</SectionHeader>
      </Row>
    )}

    {pasture.plantCommunities.map((community, i) => (
      <React.Fragment key={community.id}>
        <PlantCommunity plantCommunity={community} />
        {i + 1 !== pasture.plantCommunities.length && <Line />}
      </React.Fragment>
    ))}
  </>
)

export default Pasture
