import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('frontend/public/assets/screenshots');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set larger viewport for better screenshots
    await page.setViewport({ width: 1440, height: 900 });

    const baseUrl = process.argv[2] || 'http://localhost:5173';

    try {
        // Helper to find element by text
        const findByText = async (text, tag = 'button') => {
            return page.evaluateHandle((text, tag) => {
                const elements = Array.from(document.querySelectorAll(tag));
                return elements.find(el => el.textContent.includes(text));
            }, text, tag);
        };

        console.log('Navigating to Dashboard...');
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Check if we need to load sample data
        const sampleDataBtnHandle = await findByText('Try Sample Data', 'button');
        const sampleDataBtn = sampleDataBtnHandle.asElement();

        if (sampleDataBtn) {
            console.log('Clicking Try Sample Data...');
            await sampleDataBtn.click();
            // Wait for generation/loading
            await new Promise(r => setTimeout(r, 5000)); // Wait for insights to generate
        }

        // Capture Dashboard (Insights)
        console.log('Capturing Dashboard...');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard_insights.png'), fullPage: false });

        // Capture Expanded Insight (Deep Dive)
        // Find first insight card and click expand if possible, or just screenshot
        // Assuming cards have a class or role. Let's just screenshot the grid for now.

        // Switch to Action Plan tab
        console.log('Switching to Action Plan...');
        const actionPlanTabHandle = await findByText('Action Plan', 'button');
        const actionPlanTab = actionPlanTabHandle.asElement();

        if (actionPlanTab) {
            await actionPlanTab.click();
            await new Promise(r => setTimeout(r, 1000));
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'action_plan.png') });
        }

        // Go to Simulations
        console.log('Navigating to Simulations...');
        await page.goto(`${baseUrl}/simulations`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'market_simulation.png') });

        // Go to Integrations
        console.log('Navigating to Integrations...');
        await page.goto(`${baseUrl}/integrations`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'integrations.png') });

        console.log('Screenshots captured successfully!');

    } catch (error) {
        console.error('Error capturing screenshots:', error);
    } finally {
        await browser.close();
    }
}

capture();
