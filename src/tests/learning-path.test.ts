import { test, expect } from '@playwright/test';

test.describe('Learning Path Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-learning-path');
  });

  test('should allow creating a new learning path with all required fields', async ({ page }) => {
    // Switch to create tab
    await page.click('button:has-text("✨ Create New Path")');

    // Fill in basic information
    await page.fill('input[placeholder="Enter learning path title"]', 'Test Learning Path');
    await page.fill('textarea[placeholder="Describe what students will learn"]', 'This is a test learning path description');
    
    // Fill metadata
    await page.click('#grade');
    await page.click('text="6th Grade"');
    
    await page.click('#subject');
    await page.click('text="Mathematics"');
    
    await page.fill('input[placeholder="e.g., Algebra, Newton\'s Laws"]', 'Algebra Basics');
    await page.fill('input[placeholder="e.g., 1.2, Chapter 3"]', '1.1');
    
    // Add tags
    const tagsInput = page.locator('input[placeholder="Add tags (comma separated)"]');
    await tagsInput.fill('math');
    await tagsInput.press('Enter');
    await tagsInput.fill('algebra');
    await tagsInput.press('Enter');

    // Add a video step
    await page.click('button:has-text("Video")');
    await page.fill('input[placeholder="Paste YouTube URL..."]', 'https://www.youtube.com/watch?v=test123');
    await page.click('button:has-text("Add Step")');

    // Add a conversation step
    await page.click('button:has-text("Conversation")');
    await page.fill('textarea[placeholder="Enter conversation message..."]', 'Let\'s practice solving equations');
    await page.fill('input[placeholder="Option 1, Option 2, Option 3..."]', 'Yes, I understand, Need more examples, Let\'s move on');
    await page.click('button:has-text("Add Step")');

    // Save the learning path
    await page.click('button:has-text("Save Learning Path")');

    // Verify success message
    await expect(page.locator('text=Learning path has been created')).toBeVisible();
  });

  test('should validate required fields when creating a learning path', async ({ page }) => {
    await page.click('button:has-text("✨ Create New Path")');
    await page.click('button:has-text("Save Learning Path")');

    // Verify error messages for required fields
    await expect(page.locator('text=Please provide a title')).toBeVisible();
    await expect(page.locator('text=Please provide a description')).toBeVisible();
    await expect(page.locator('text=Please select a grade level')).toBeVisible();
    await expect(page.locator('text=Please select a subject')).toBeVisible();
    await expect(page.locator('text=Please add at least one step')).toBeVisible();
  });

  test('should allow browsing and filtering learning paths', async ({ page }) => {
    // Search functionality
    await page.fill('input[placeholder*="Search paths"]', 'algebra');
    await expect(page.locator('text=Searching...')).toBeVisible();
    
    // Filter by grade
    await page.click('text="Filter by grade"');
    await page.click('text="6th Grade"');
    
    // Filter by subject
    await page.click('text="Filter by subject"');
    await page.click('text="Mathematics"');
    
    // Verify filtered results
    await expect(page.locator('text=No Learning Paths Found')).toBeVisible();
    
    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    await expect(page.locator('.card')).toBeVisible();
  });

  test('should allow cloning an existing learning path', async ({ page }) => {
    // Find and clone a learning path
    await page.hover('.card:first-child');
    await page.click('.card:first-child button:has-text("Copy")');
    
    // Verify success message
    await expect(page.locator('text=Learning path cloned successfully')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test API error handling
    await page.route('**/api/learning-paths/public', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { message: 'Internal server error' } })
      });
    });

    await page.reload();
    await expect(page.locator('text=Error loading learning paths')).toBeVisible();
  });
});