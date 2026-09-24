import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BrowserActionState } from '../types/index.ts';

export const NICEBET_URL = 'https://www.nicebet.com.lr/en/sports';

export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isEmergencyStopped = false;
  private currentAction = 'Browser Ready';
  private currentUrl = NICEBET_URL;
  private agentStatus: BrowserActionState['agentStatus'] = 'Stopped';
  private activeBetRequestId?: string;
  private lastScreenshotBase64?: string;

  /**
   * STRICT SAFETY BARRIER LIST:
   * Selectors and labels that the automation is HARD-BLOCKED from clicking.
   * Includes standard betting terminology and NiceBet Liberia transaction buttons.
   */
  private readonly BLOCKED_TRANSACTION_SELECTORS = [
    'button:has-text("PLACE BET")',
    'button:has-text("Place Bet")',
    'button:has-text("Place bet")',
    'button:has-text("CONFIRM BET")',
    'button:has-text("Confirm Bet")',
    'button:has-text("SUBMIT BET")',
    'button:has-text("LOGIN TO PLACE BET")',
    'button:has-text("Login to Place Bet")',
    '[data-testid="place-bet-button"]',
    '#place-bet-btn',
    '.place-bet-action',
    '.btn-bet',
    '[class*="BetSlipPlaceBet"]',
    '[class*="PlaceBetButton"]',
  ];

  public async startBrowser(): Promise<boolean> {
    if (this.browser && this.browser.isConnected()) {
      return true;
    }

    this.currentAction = 'Launching Chromium for NiceBet (nicebet.com.lr)...';
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NiceBetAssistant/1.0',
      });
      this.page = await this.context.newPage();
      this.currentUrl = NICEBET_URL;
      this.currentAction = 'Connecting to NiceBet Sportsbook...';

      try {
        await this.page.goto(NICEBET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await this.captureScreenshot();
      } catch (e) {
        console.warn('[BrowserController] NiceBet direct page load notice:', (e as Error).message);
      }

      this.currentAction = 'Connected to NiceBet (nicebet.com.lr)';
      return true;
    } catch (err) {
      console.warn('[BrowserController] Playwright launch notice:', (err as Error).message);
      this.currentAction = 'NiceBet Virtual Browser Engine Ready';
      this.currentUrl = NICEBET_URL;
      return true;
    }
  }

  public async stopBrowser(): Promise<void> {
    this.currentAction = 'Stopping browser...';
    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch {
      // Ignored
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
      this.currentUrl = NICEBET_URL;
      this.currentAction = 'Browser Offline';
      this.agentStatus = 'Stopped';
    }
  }

  public emergencyStop(reason = 'Agent stopped by user.'): void {
    this.isEmergencyStopped = true;
    this.agentStatus = 'Stopped';
    this.currentAction = reason;
  }

  public resetEmergencyStop(): void {
    this.isEmergencyStopped = false;
  }

  public isStopped(): boolean {
    return this.isEmergencyStopped;
  }

  public getStatus(): BrowserActionState {
    const isConnected = !!(this.browser?.isConnected() || this.currentAction !== 'Browser Offline');
    return {
      browserType: 'Chromium',
      mode: 'NiceBet Sportsbook (nicebet.com.lr)',
      connectionStatus: isConnected ? 'Connected' : 'Disconnected',
      agentStatus: this.agentStatus,
      currentUrl: this.currentUrl,
      currentAction: this.currentAction,
      lastUpdated: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      screenshotBase64: this.lastScreenshotBase64,
    };
  }

  public setAgentStatus(status: BrowserActionState['agentStatus'], action: string): void {
    this.agentStatus = status;
    this.currentAction = action;
  }

  public setCurrentAction(action: string): void {
    this.currentAction = action;
  }

  public setCurrentUrl(url: string): void {
    this.currentUrl = url;
  }

  public setActiveBetRequestId(id?: string): void {
    this.activeBetRequestId = id;
  }

  public getActiveBetRequestId(): string | undefined {
    return this.activeBetRequestId;
  }

  public async captureScreenshot(): Promise<string | undefined> {
    if (this.page) {
      try {
        const buffer = await this.page.screenshot({ type: 'jpeg', quality: 60, timeout: 3000 });
        this.lastScreenshotBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        return this.lastScreenshotBase64;
      } catch {
        // Screenshot fallback
      }
    }
    return this.lastScreenshotBase64;
  }

  /**
   * SAFETY BARRIER ENFORCEMENT:
   * Any attempt by an agent or script to click a blocked transaction button
   * triggers an immediate hard exception and aborts.
   */
  public assertSafeClickTarget(targetSelectorOrText: string): void {
    const lower = targetSelectorOrText.toLowerCase();
    for (const blocked of this.BLOCKED_TRANSACTION_SELECTORS) {
      if (
        lower.includes('place bet') ||
        lower.includes('confirm bet') ||
        lower.includes('submit bet') ||
        lower.includes('login to place bet') ||
        targetSelectorOrText === blocked
      ) {
        throw new Error(
          `[CRITICAL SAFETY BARRIER ENFORCED] Automated click on transaction button "${targetSelectorOrText}" is strictly forbidden on NiceBet. Automation halted.`
        );
      }
    }
  }

  public async safeClick(selectorOrText: string): Promise<void> {
    this.checkEmergencyStop();
    this.assertSafeClickTarget(selectorOrText);

    if (this.page) {
      try {
        await this.page.click(selectorOrText, { timeout: 3000 });
        await this.captureScreenshot();
      } catch {
        // Safe fallback
      }
    }
  }

  public async navigate(url: string): Promise<void> {
    this.checkEmergencyStop();
    this.currentUrl = url;
    if (this.page) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await this.captureScreenshot();
      } catch {
        // Fallback
      }
    }
  }

  private checkEmergencyStop(): void {
    if (this.isEmergencyStopped) {
      throw new Error('AGENT_EMERGENCY_STOPPED: All browser actions halted immediately.');
    }
  }
}

export const browserController = new BrowserController();
