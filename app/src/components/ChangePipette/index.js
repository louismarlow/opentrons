// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push, goBack } from 'react-router-redux'
import { Switch, Route, withRouter, type Match } from 'react-router'
import {
  getPipetteNameSpecs,
  getPipetteModelSpecs,
} from '@opentrons/shared-data'
import { getConfig } from '../../config'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
} from '@opentrons/shared-data'
import type { State, Dispatch } from '../../types'
import type { Mount } from '../../robot'
import type { Robot } from '../../discovery'
import type { Direction, ChangePipetteProps } from './types'
import type { RobotHome, RobotMove } from '../../http-api-client'

import {
  home,
  moveRobotTo,
  disengagePipetteMotors,
  makeGetRobotMove,
  makeGetRobotHome,
} from '../../http-api-client'

import { fetchPipettes, getPipettesState } from '../../robot-api'

import ClearDeckAlertModal from '../ClearDeckAlertModal'
import ExitAlertModal from './ExitAlertModal'
import type { PipetteSelectionProps } from './PipetteSelection'
import Instructions from './Instructions'
import ConfirmPipette from './ConfirmPipette'
import RequestInProgressModal from './RequestInProgressModal'

type Props = {
  match: Match,
  robot: Robot,
  parentUrl: string,
}

const TITLE = 'Pipette Setup'
// used to guarentee mount param in route is left or right
const RE_MOUNT = '(left|right)'

type OP = {|
  title: string,
  subtitle: string,
  mount: Mount,
  robot: Robot,
  wantedPipette: ?PipetteNameSpecs,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  parentUrl: string,
|}

type SP = {|
  moveRequest: RobotMove,
  homeRequest: RobotHome,
  actualPipette: ?PipetteModelSpecs,
  displayName: string,
  direction: Direction,
  success: boolean,
  attachedWrong: boolean,
  __pipettePlusEnabled: boolean,
|}

type DP = {|
  exit: () => mixed,
  back: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  moveToFront: () => mixed,
  checkPipette: () => mixed,
  confirmPipette: () => mixed,
|}

const ConnectedChangePipetteRouter = withRouter<OP>(
  connect<ChangePipetteProps, _, SP, DP, State, Dispatch>(
    makeMapStateToProps,
    mapDispatchToProps
  )(ChangePipetteRouter)
)

function ChangePipetteRouter(props: ChangePipetteProps) {
  const { baseUrl, confirmUrl, exitUrl, moveRequest, homeRequest } = props
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl,
    onContinueClick: props.moveToFront,
  }
  if (!moveRequest.inProgress && !moveRequest.response) {
    return (
      <ClearDeckAlertModal {...clearDeckProps}>
        {props.actualPipette && (
          <p>
            Detaching a pipette will also clear its related calibration data
          </p>
        )}
      </ClearDeckAlertModal>
    )
  }

  if (moveRequest.inProgress || homeRequest.inProgress) {
    return <RequestInProgressModal {...props} />
  }

  return (
    <Switch>
      <Route exact path={baseUrl} render={() => <Instructions {...props} />} />
      <Route path={exitUrl} render={() => <ExitAlertModal {...props} />} />
      <Route path={confirmUrl} render={() => <ConfirmPipette {...props} />} />
    </Switch>
  )
}

function makeMapStateToProps(): (State, OP) => SP {
  const getRobotMove = makeGetRobotMove()
  const getRobotHome = makeGetRobotHome()

  return (state, ownProps) => {
    const { mount, wantedPipette, robot } = ownProps
    const pipettes = getPipettesState(state, robot.name)
    const actualPipette = getPipetteModelSpecs(pipettes[mount]?.model || '')
    const direction = actualPipette ? 'detach' : 'attach'

    const success =
      actualPipette?.name === wantedPipette?.name ||
      (!actualPipette && !wantedPipette)

    const attachedWrong = !!(!success && wantedPipette && actualPipette)

    const displayName =
      actualPipette?.displayName || wantedPipette?.displayName || ''

    return {
      actualPipette,
      direction,
      success,
      attachedWrong,
      displayName,
      moveRequest: getRobotMove(state, ownProps.robot),
      homeRequest: getRobotHome(state, ownProps.robot),
      __pipettePlusEnabled: Boolean(
        getConfig(state).devInternal?.enablePipettePlus
      ),
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { confirmUrl, parentUrl, baseUrl, robot, mount } = ownProps
  const disengage = () => dispatch(disengagePipetteMotors(robot, mount))
  const checkPipette = () =>
    disengage().then(() => dispatch(fetchPipettes(robot, true)))

  return {
    checkPipette,
    exit: () =>
      dispatch(home(robot, mount)).then(() => dispatch(push(parentUrl))),
    back: () => dispatch(goBack()),
    onPipetteSelect: evt => dispatch(push(`${baseUrl}/${evt.target.value}`)),
    moveToFront: () =>
      dispatch(
        moveRobotTo(robot, {
          mount,
          position: 'change_pipette',
        })
      ).then(disengage),
    confirmPipette: () => checkPipette().then(() => dispatch(push(confirmUrl))),
  }
}

export default function ChangePipette(props: Props) {
  const {
    robot,
    parentUrl,
    match: { path },
  } = props

  return (
    <Route
      path={`${path}/:mount${RE_MOUNT}/:name?`}
      render={propsWithMount => {
        const { params, url: baseUrl } = propsWithMount.match
        const mount: Mount = (params.mount: any)

        const wantedPipette = params.name
          ? getPipetteNameSpecs(params.name)
          : null

        return (
          <ConnectedChangePipetteRouter
            robot={robot}
            title={TITLE}
            subtitle={`${mount} mount`}
            mount={mount}
            wantedPipette={wantedPipette}
            parentUrl={parentUrl}
            baseUrl={baseUrl}
            confirmUrl={`${baseUrl}/confirm`}
            exitUrl={`${baseUrl}/exit`}
          />
        )
      }}
    />
  )
}
