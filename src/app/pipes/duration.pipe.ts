import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(duration: number): string {
    console.log('Duration pipe received:', duration);
    if (!duration || isNaN(duration)) {
      console.log('Invalid duration value');
      return '00:00';
    }
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const result = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log('Duration pipe output:', result);
    return result;
  }
} 