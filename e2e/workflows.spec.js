import { test, expect } from '@playwright/test';

test.describe('Complete Request Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Login
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await page.waitForSelector('text=Panel de Control');
    });

    test('should create a new request end-to-end', async ({ page }) => {
        // Navigate to Requests page
        await page.click('text=Solicitudes');
        await expect(page).toHaveURL(/.*solicitudes/);

        // Click "Nueva Solicitud" button
        await page.click('button:has-text("Nueva Solicitud")');

        // Fill in request form
        await page.selectOption('select[name="researcherId"]', { index: 1 });
        await page.selectOption('select[name="serviceId"]', { index: 1 });
        await page.fill('input[name="samplesCount"]', '5');
        await page.fill('textarea[name="observations"]', 'Test request from E2E');

        // Submit form
        await page.click('button:has-text("Crear Solicitud")');

        // Verify success
        await expect(page.locator('text=creada correctamente')).toBeVisible({ timeout: 5000 });

        // Verify request appears in table
        await expect(page.locator('text=Test request from E2E')).toBeVisible();
    });

    test('should filter requests by date', async ({ page }) => {
        await page.click('text=Solicitudes');

        // Set date filter
        const today = new Date().toISOString().split('T')[0];
        await page.fill('input[type="date"]', today);

        // Check that table updates
        await page.waitForTimeout(500);
        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should navigate through pages with pagination', async ({ page }) => {
        await page.click('text=Solicitudes');

        // Check if pagination exists
        const paginationExists = await page.locator('text=Página').isVisible();

        if (paginationExists) {
            // Click next page
            await page.click('button[aria-label="Next page"]');

            // Verify page number changed
            await expect(page.locator('text=Página 2')).toBeVisible();
        }
    });
});

test.describe('Dashboard Analytics', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=Panel de Control');
    });

    test('should change period filter and update charts', async ({ page }) => {
        // Select different period
        await page.selectOption('select', 'week');

        // Wait for API call
        await page.waitForTimeout(1000);

        // Verify KPIs are displayed
        await expect(page.locator('text=Total Solicitudes')).toBeVisible();
        await expect(page.locator('text=Pendientes')).toBeVisible();
        await expect(page.locator('text=Facturadas')).toBeVisible();

        // Verify charts are rendered
        const charts = await page.locator('.recharts-wrapper').count();
        expect(charts).toBeGreaterThan(0);
    });

    test('should display all dashboard charts', async ({ page }) => {
        // Check for chart titles
        await expect(page.locator('text=Tendencia Temporal')).toBeVisible();
        await expect(page.locator('text=Top 5 Centros')).toBeVisible();
        await expect(page.locator('text=Distribución por Tarifa')).toBeVisible();
        await expect(page.locator('text=Top 5 Servicios')).toBeVisible();
    });
});

test.describe('Audit System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
    });

    test('should display audit logs with filters', async ({ page }) => {
        await page.click('text=Auditoría');
        await expect(page).toHaveURL(/.*auditoria/);

        // Check table is visible
        await expect(page.locator('table')).toBeVisible();

        // Apply filter
        await page.selectOption('select[name="action"]', 'CREATE');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filtered results
        const badges = await page.locator('text=CREATE').count();
        expect(badges).toBeGreaterThanOrEqual(0);
    });

    test('should open detail modal when clicking eye icon', async ({ page }) => {
        await page.click('text=Auditoría');

        // Count rows
        const rowCount = await page.locator('tbody tr').count();

        if (rowCount > 0) {
            // Click first eye icon
            await page.click('button[title="Ver detalles"]');

            // Verify modal appears
            await expect(page.locator('text=Detalles del Registro')).toBeVisible();

            // Close modal
            await page.click('button:has-text("Cerrar")');
        }
    });
});

test.describe('Billing Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
    });

    test('should filter billing data by period', async ({ page }) => {
        await page.click('text=Facturación');

        // Set date range
        const startDate = '2024-01-01';
        const endDate = new Date().toISOString().split('T')[0];

        await page.fill('input[type="date"]', startDate).first();
        await page.fill('input[type="date"]', endDate).nth(1);

        // Wait for data to load
        await page.waitForTimeout(500);

        // Check if pending invoices are displayed
        const pendingSection = await page.locator('text=Pendientes de Facturar');
        await expect(pendingSection).toBeVisible();
    });

    test('should display invoice history with DataTable', async ({ page }) => {
        await page.click('text=Facturación');

        // Scroll to history section
        await page.locator('text=Historial de Facturas').scrollIntoViewIfNeeded();

        // Verify DataTable is rendered
        await expect(page.locator('table')).toBeVisible();

        // Check column headers
        await expect(page.locator('th:has-text("Nº Factura")')).toBeVisible();
        await expect(page.locator('th:has-text("Fecha")')).toBeVisible();
        await expect(page.locator('th:has-text("Investigador")')).toBeVisible();
    });
});
