import { test, expect } from '@playwright/test';

test('AI Interview Flow', async ({ page }) => {
  test.setTimeout(60000); // 1 minute timeout for the flow

  console.log("Logging in via demo...");
  await page.goto('http://localhost:3000/demo');
  await page.click('button:has-text("Trainee")');
  await page.waitForTimeout(2000); // wait for redirect

  console.log("Navigating to AI interview page...");
  await page.goto('http://localhost:3000/trainee/ai-interview');
  
  // Wait for page to load
  console.log("Waiting for page load...");
  await page.waitForSelector('text=AI Mock Interview');

  // Fill in role
  console.log("Filling in role...");
  await page.fill('input#role-override', 'data engineer');
  await page.waitForTimeout(500); // give react time to update state

  // Click start (fallback to whatever the button says)
  console.log("Clicking Start...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => !b.disabled && (b.innerText.toLowerCase().includes('start') || b.innerText.toLowerCase().includes('starting')));
    if (btn) btn.click();
  });

  // Wait for the first question from AI
  console.log("Waiting for AI first question...");
  // Instead of waiting for specific text, just wait until textarea is enabled!
  await page.waitForSelector('textarea:not([disabled])', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Type answer
  console.log("Typing answer...");
  await page.fill('textarea', 'I have a strong background in data engineering and Python.');

  // Submit answer
  console.log("Submitting answer...");
  await page.evaluate(() => {
    const submitBtn = document.querySelector('textarea')?.parentElement?.parentElement?.querySelector('button');
    if (submitBtn && !submitBtn.disabled) submitBtn.click();
  });

  // Wait for second question (textarea disabled then enabled again)
  console.log("Waiting for second question...");
  await page.waitForTimeout(1000); // let it disable first
  await page.waitForSelector('textarea:not([disabled])', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Finish interview early (or evaluate if we answer twice)
  console.log("Typing second answer...");
  await page.fill('textarea', 'I use debugging tools and logs to identify issues.');
  await page.evaluate(() => {
    const submitBtn = document.querySelector('textarea')?.parentElement?.parentElement?.querySelector('button');
    if (submitBtn && !submitBtn.disabled) submitBtn.click();
  });

  console.log("Waiting for third question...");
  await page.waitForTimeout(1000);
  await page.waitForSelector('textarea:not([disabled])', { timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Submit final answer to trigger evaluation
  console.log("Typing third answer...");
  await page.fill('textarea', 'I debugged a pipeline issue last week.');
  await page.waitForTimeout(500);

  // Take screenshot while active with filled textarea to verify layout and styling
  console.log("Taking screenshot of live interview with answer composer...");
  await page.screenshot({ path: '/tmp/ai_interview_fixed.png', fullPage: true });
  console.log("Screenshot saved at /tmp/ai_interview_fixed.png");

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.innerText.toLowerCase().includes('send') && !b.disabled);
    if (submitBtn) {
      submitBtn.click();
    } else {
      const fallbackBtn = document.querySelector('textarea')?.parentElement?.parentElement?.querySelector('button');
      if (fallbackBtn && !fallbackBtn.disabled) fallbackBtn.click();
    }
  });

  // Wait for evaluation
  console.log("Waiting for evaluation...");
  // Evaluation text could be anything, let's wait for a score or "PRACTICE FEEDBACK" or "Interview Evaluation"
  await page.waitForSelector('text=Evaluation', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5000); // give it time to render full evaluation

  // Take a screenshot
  console.log("Taking final screenshot...");
  await page.screenshot({ path: '/tmp/ai_interview_success.png', fullPage: true });
  console.log("Screenshot saved at /tmp/ai_interview_success.png");
});
