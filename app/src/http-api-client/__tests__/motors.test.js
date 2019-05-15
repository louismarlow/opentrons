// http api /motors/** enpoints tests
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import client from '../client'
import { disengagePipetteMotors } from '..'

jest.mock('../client')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const NAME = 'opentrons-dev'

describe('/motors/**', () => {
  let robot
  let state
  let store

  beforeEach(() => {
    client.__clearMock()

    robot = { name: NAME, ip: '1.2.3.4', port: '1234' }
    state = {
      robotApi: {
        [NAME]: {
          resources: {
            pipettes: {
              left: { mount_axis: 'z', plunger_axis: 'b' },
              right: { mount_axis: 'a', plunger_axis: 'c' },
            },
          },
        },
      },
      api: {
        api: {
          [NAME]: {
            motors: {},
          },
        },
      },
    }

    store = mockStore(state)
  })

  describe('disengagePipetteMotors action creator', () => {
    const path = 'motors/disengage'
    const response = { message: 'we did it' }

    test('adds pipette axes to request body', () => {
      const expected = { axes: ['z', 'b'] }

      client.__setMockResponse(response)

      // use mock.calls to verify call order
      return store
        .dispatch(disengagePipetteMotors(robot, 'left'))
        .then(() =>
          expect(client.mock.calls).toEqual([
            [robot, 'POST', 'motors/disengage', expected],
          ])
        )
    })

    test('dispatches MOTORS_REQUEST and MOTORS_SUCCESS', () => {
      const request = { mounts: ['left', 'right'] }

      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:SUCCESS', payload: { robot, response, path } },
      ]

      client.__setMockResponse(response)

      return store
        .dispatch(disengagePipetteMotors(robot, 'left', 'right'))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })

    test('dispatches MOTORS_REQUEST and MOTORS_FAILURE', () => {
      const request = { mounts: ['left', 'right'] }
      const error = { name: 'ResponseError', status: '400' }
      const expectedActions = [
        { type: 'api:REQUEST', payload: { robot, request, path } },
        { type: 'api:FAILURE', payload: { robot, error, path } },
      ]

      client.__setMockError(error)

      return store
        .dispatch(disengagePipetteMotors(robot, 'left', 'right'))
        .then(() => expect(store.getActions()).toEqual(expectedActions))
    })
  })
})
