import { Arc, IArcOptions } from "@daostack/arc.js";

const subGraphEndpoints = require("../../src/subgraph_endpoints.json");

const settings: IArcOptions & { txSenderServiceUrl: string } = {
  graphqlHttpProvider: subGraphEndpoints.http_ganache,
  graphqlWsProvider: subGraphEndpoints.ws_ganache,
  graphqlSubscribeToQueries: false,
  web3Provider: "http://127.0.0.1:8545",
  ipfsProvider: "http://127.0.0.1:5001/api/v0",
  txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
};

const chai = require("chai");

global.expect = chai.expect;
chai.Should();

export const LATEST_ARC_VERSION = require("@daostack/migration-experimental/package.json")["dependencies"]["@daostack/arc-experimental"];

export const userAddresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
];

export function getArc() {
  const arc = new Arc(settings);
  arc.setAccount(userAddresses[0]);
  return arc;
}

export interface ITestAddresses {
  dao: {
    name: string;
    Avatar: string;
    DAOToken: string;
    Reputation: string;
    Controller: string;
    Plugins: Array<{
      name: string;
      alias: string;
      address: string;
    }>;
  };
  queuedProposalId: string;
  preBoostedProposalId: string;
  boostedProposalId: string;
  executedProposalId: string;
  organs: {
    DemoAvatar: string;
    DemoDAOToken: string;
    DemoReputation: string;
    ActionMock: string;
  };
}

export function getTestAddresses(version: string = LATEST_ARC_VERSION): ITestAddresses {
  return require("@daostack/test-env-experimental/daos.json").demo[version];
}

/**
 * Note this won't work until you've browsed into the app.
 */
export async function hideCookieAcceptWindow(): Promise<void> {
  let acceptCookiesButton = await $("*[data-test-id=\"acceptCookiesButton\"]");
  for (let i = 0; i < 3; ++i) {
    await acceptCookiesButton.waitForExist({ timeout: 2000 });
    if (!acceptCookiesButton.error && await acceptCookiesButton.isDisplayedInViewport()) {
      await acceptCookiesButton.click();
      return;
    } else {
      acceptCookiesButton = await $("*[data-test-id=\"acceptCookiesButton\"]");
    }
  }
}

export async function hideTrainingTooltips() {
  localStorage.setItem("trainingTooltipsEnabled", "false");
}

export const setCalendarDate = async (element: any, date: string): Promise<void> => {
  await element.click(); // hide previous calendar
  await element.setValue(date);
};

export async function gotoDaoPlugins(daoAddress: string): Promise<any> {
  return browser.url(`/dao/${daoAddress}/plugins`);
}

/**
 * Accept cookies if the cookies window appears.
 * @param void
 * @returns Promise<void>
 */
export const acceptCookies = async(): Promise<void> => {
  const acceptCookiesButton = await $("*[data-test-id=\"acceptCookiesButton\"]");
  if (acceptCookiesButton.isExisting()) {
    acceptCookiesButton.click();
  }
};

/**
 * Searches for a submit button and clicks it.
 * @param void
 * @return Promise<void>
 */
export const submit = async(): Promise<void> => {
  const submitButton = await $("*[type=\"submit\"]");
  await submitButton.waitForExist();
  await submitButton.scrollIntoView();
  await submitButton.click();
};
