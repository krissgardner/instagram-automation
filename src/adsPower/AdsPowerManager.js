const puppeteer = require("puppeteer");
const axios = require("axios");

class AdsPowerManager {
  constructor(endpoint, apiKey) {
    this.bots = {};
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async checkServerConnection() {
    // https://localapi-doc-en.adspower.com/docs/6DSiws

    try {
      const res = await axios.get(`${this.endpoint}/status`, {
        headers: {
          "api-key": this.apiKey,
        },
      });
      return res?.data?.code === 0;
    } catch (e) {
      console.error("Ads Power API is not available");
      return false;
    }
  }

  async openBrowser(profileId) {
    // https://localapi-doc-en.adspower.com/docs/FFMFMf

    try {
      const res = await axios.get(`${this.endpoint}/api/v1/browser/start`, {
        params: {
          user_id: profileId,
          open_tabs: 0,
        },
        headers: {
          "api-key": this.apiKey,
        },
      });

      const { data, code } = res.data;

      if (code !== 0) {
        console.error("Couldn't open browser for profile id", profileId);
        return;
      }

      return data;
    } catch (e) {
      console.error("Couldn't open browser for profile id", profileId);
    }
  }

  async closeBrowser(profileId) {
    // https://localapi-doc-en.adspower.com/docs/DXam94

    try {
      const res = await axios.get(`${this.endpoint}/api/v1/browser/stop`, {
        params: {
          user_id: profileId,
        },
        headers: {
          "api-key": this.apiKey,
        },
      });

      return res?.data?.data?.code === 0;
    } catch (e) {
      console.log("Couldn't close browser for profile id", profileId);
      return false;
    }
  }

  async checkBrowserStatus(profileId) {
    // https://localapi-doc-en.adspower.com/docs/YjFggL

    try {
      const res = await axios.get(`${this.endpoint}/api/v1/browser/active`, {
        params: {
          user_id: profileId,
        },
        headers: {
          "api-key": this.apiKey,
        },
      });

      const { data, code } = res.data;

      if (code !== 0) {
        return;
      }

      return data;
    } catch (e) {
      console.log("Couldn't check status for profile id", profileId);
      return false;
    }
  }

  async getBrowser(id) {
    let connection;

    // Check if it's open
    const browserStatus = await this.checkBrowserStatus(id);
    if (browserStatus?.status === "Active") {
      connection = browserStatus.ws.puppeteer;
    } else {
      // Open the connection
      const browserConnection = await this.openBrowser(id);
      if (!browserConnection) {
        return;
      }
      connection = browserConnection.ws.puppeteer;
    }

    if (!connection) {
      return;
    }

    const browserWSEndpoint = connection;
    return await puppeteer.connect({
      browserWSEndpoint,
    });
  }
}

module.exports = AdsPowerManager;
