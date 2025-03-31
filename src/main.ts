import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(() => {
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background: #f44336; color: white; border-radius: 4px; text-align: center;';
    errorElement.textContent = 'Failed to start the application. Please refresh the page or contact support if the issue persists.';
    document.body.appendChild(errorElement);
  });
