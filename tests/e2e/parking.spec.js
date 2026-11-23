import{test,expect}from'@playwright/test';
test('muestra el título',async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:'Parqueo Fácil'})).toBeVisible()});
test('muestra ocho plazas iniciales',async({page})=>{await page.goto('/');await expect(page.locator('.spot')).toHaveCount(8)});
test('muestra la tarifa',async({page})=>{await page.goto('/');await expect(page.getByText('Tarifa: Bs 5')).toBeVisible()});
test('registra una entrada',async({page})=>{await page.goto('/');await page.getByLabel('Placa').fill('E2E1001');await page.getByLabel('Plaza',{exact:true}).selectOption('A1');await page.getByRole('button',{name:'Registrar entrada'}).click();await expect(page.getByRole('cell',{name:'E2E1001'})).toBeVisible()});
test('registra salida y cobro',async({page})=>{await page.goto('/');await page.getByLabel('Placa').fill('E2E1002');await page.getByLabel('Plaza',{exact:true}).selectOption('A2');await page.getByRole('button',{name:'Registrar entrada'}).click();await page.getByRole('button',{name:'Registrar salida'}).last().click();await expect(page.getByRole('cell',{name:'Bs 5'}).last()).toBeVisible()});
test('agrega una plaza',async({page})=>{await page.goto('/');await page.getByLabel('Código de plaza').fill('B9');await page.getByRole('button',{name:'Agregar plaza'}).click();await expect(page.locator('.spot').filter({hasText:'B9'})).toBeVisible()});

