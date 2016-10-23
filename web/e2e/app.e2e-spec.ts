import { WebCliPage } from './app.po';

describe('web-cli App', function() {
  let page: WebCliPage;

  beforeEach(() => {
    page = new WebCliPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
