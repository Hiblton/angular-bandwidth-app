import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000);
    return `${seconds}`;
  }
} 