import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { AppComponent } from './app/app.component';
import { VideoState } from './app/store/video.state';
import { BandwidthService } from './app/services/bandwidth.service';
import { VideoStorageService } from './app/services/video-storage.service';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    BandwidthService,
    VideoStorageService,
    importProvidersFrom(
      NgxsModule.forRoot([VideoState], {
        developmentMode: true
      }),
      NgxsReduxDevtoolsPluginModule.forRoot(),
      NgxsLoggerPluginModule.forRoot()
    )
  ]
}).catch(err => console.error(err));
