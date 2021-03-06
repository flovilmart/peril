const pingMock = jest.fn()
jest.mock("../../github/events/ping", () => ({ ping: pingMock }))

const createInstallationMock = jest.fn()
jest.mock("../../github/events/create_installation", () => ({ createInstallation: createInstallationMock }))

const githubRunnerMock = jest.fn()
jest.mock("../../github/events/github_runner", () => ({ githubDangerRunner: githubRunnerMock }))

import { githubRouting } from "../router"

const validRequest = { isXHub: true, isXHubValid: () => true }
const noXhub = { isXHub: false }
const badXHub = { isXHub: true, isXHubValid: () => false }

describe("validating webhooks from GitHub", () => {
  let req: any

  beforeEach(() => {
    req = {}
    req.status = jest.fn(() => req)
    req.send = jest.fn()
  })

  it("fails when there is is no x-hub", () => {
    githubRouting("ping", noXhub, req, {})
    expect(req.status).toBeCalledWith(400)
    expect(req.send).toBeCalledWith("Request did not include x-hub header.")
  })

  it("fails when there is is no x-hub", () => {
    githubRouting("ping", badXHub, req, {})
    expect(req.status).toBeCalledWith(401)

    const message = req.send.mock.calls[0][0]
    expect(message).toContain("Request did not have a valid x-hub header")
  })
})

describe("routing for GitHub", () => {
  it("calls ping when a ping action is sent", () => {
    githubRouting("ping", validRequest, {}, {})
    expect(pingMock).toBeCalled()
  })

  it("creates an installation when an integration is created", () => {
    const body = { action: "created" }
    githubRouting("integration_installation", { ...validRequest, body }, {}, {})
    expect(createInstallationMock).toBeCalled()
  })

  it("calls the GitHub runner for any other event", () => {
    githubRouting("issue", validRequest, {}, {})
    expect(githubRunnerMock).toBeCalledWith("issue", validRequest, {}, {})

    githubRouting("new_user", validRequest, {}, {})
    expect(githubRunnerMock).toBeCalledWith("new_user", validRequest, {}, {})

    githubRouting("random_thing", validRequest, {}, {})
    expect(githubRunnerMock).toBeCalledWith("random_thing", validRequest, {}, {})
  })
})
