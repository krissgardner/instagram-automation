export interface BrowserStatus {
  status: string;
  ws: {
    puppeteer: string;
  };
}

export interface BrowserConnection {
  ws: {
    puppeteer: string;
  };
}
