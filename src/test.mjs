import {Builder, By, Key, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('Automated Functional Test', async function() {
    let driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless())
        .build();
  
    it('should display the correct title', async function() {
        await driver.get('http://linserv1.cims.nyu.edu:21589');
        // await driver.get('http://localhost:3000');
        const title = await driver.getTitle();
        assert.equal(title, 'Movie Reviews');
    });

    it('should search for a movie successfully', async function() {
        await driver.findElement(By.name('input')).sendKeys('The Shawshank Redemption');
        await driver.findElement(By.id('search-button')).click();
        const h2Text = await driver.findElement(By.tagName('h2')).getText();
        const target = 'The Shawshank Redemption';
        if (h2Text.includes(target)) {
            assert.equal(target, 'The Shawshank Redemption');
        }
        assert.equal(h2Text, 'The Shawshank Redemption');
    });

    it('should login successfully', async function() {
        await driver.get('http://linserv1.cims.nyu.edu:21589/login');
        // await driver.get('http://localhost:3000/login');
        await driver.findElement(By.name('username')).sendKeys('AIT');
        await driver.findElement(By.name('password')).sendKeys('12345678');
        await driver.findElement(By.id('login-button')).click();
        await driver.get('http://linserv1.cims.nyu.edu:21589/add');
        // await driver.get('http://localhost:3000/add');
        const h2Text = await driver.findElement(By.tagName('h2')).getText();
        assert.equal(h2Text, 'New Movie');
    });

    it('should logout successfully', async function() {
        await driver.findElement(By.id('logout-button')).click();
        await driver.get('http://linserv1.cims.nyu.edu:21589/add');
        // await driver.get('http://localhost:3000/add');
        const h2Text = await driver.findElement(By.tagName('h2')).getText();
        assert.equal(h2Text, 'Login');
        await driver.quit();
    });
});
