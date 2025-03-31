import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebcamModule } from 'ngx-webcam';

import { AppComponent } from './app.component';
import { VideoState } from './store/video.state';
import { BandwidthService } from './services/bandwidth.service';
import { VideoStorageService } from './services/video-storage.service';
import { VideoRecorderComponent } from './components/video-recorder/video-recorder.component';
import { VideoListComponent } from './components/video-list/video-list.component';
import { DurationPipe } from './pipes/duration.pipe';

@NgModule({
  declarations: [
    AppComponent,
    VideoRecorderComponent,
    VideoListComponent,
    DurationPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    WebcamModule,
    NgxsModule.forRoot([VideoState], {
      developmentMode: true
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot()
  ],
  providers: [
    BandwidthService,
    VideoStorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 