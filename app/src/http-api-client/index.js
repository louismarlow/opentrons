// @flow
// robot HTTP API client module
import { combineReducers } from 'redux'
import apiReducer from './reducer'
import { calibrationReducer, type CalibrationAction } from './calibration'
import type { HealthAction } from './health'
import type { MotorsAction } from './motors'
import type { ResetAction } from './reset'
import { robotReducer, type RobotAction } from './robot'
import { serverReducer, type ServerAction } from './server'
import type { NetworkingAction } from './networking'
import type { Action } from '../types'

export const reducer = combineReducers<_, Action>({
  calibration: calibrationReducer,
  robot: robotReducer,
  server: serverReducer,
  // TODO(mc, 2018-07-09): api subreducer will become the sole reducer
  api: apiReducer,
})

export * from './types'

export type {
  ApiRequestAction,
  ApiSuccessAction,
  ApiFailureAction,
  ClearApiResponseAction,
} from './actions'

export type {
  DeckCalStartState,
  DeckCalCommandState,
  JogAxis,
  JogDirection,
  JogStep,
  DeckCalPoint,
} from './calibration'

export type { RobotMove, RobotHome, RobotLights } from './robot'

export type State = $Call<typeof reducer>

export type HttpApiAction =
  | CalibrationAction
  | HealthAction
  | MotorsAction
  | NetworkingAction
  | ResetAction
  | RobotAction
  | ServerAction

export { getRobotApiState } from './reducer'

export {
  startDeckCalibration,
  deckCalibrationCommand,
  clearDeckCalibration,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState,
} from './calibration'

export * from './health'

export * from './reset'

export * from './motors'

export * from './networking'

export * from './server'

export {
  home,
  clearHomeResponse,
  moveRobotTo,
  clearMoveResponse,
  fetchRobotLights,
  setRobotLights,
  makeGetRobotMove,
  makeGetRobotHome,
  makeGetRobotLights,
} from './robot'
