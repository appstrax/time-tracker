import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimeCalculationUtils {

  public static formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    let formattedMinutes = `${minutes}m`;
    if (minutes < 10) formattedMinutes = '0' + formattedMinutes;
    let formattedHours = `${wholeHours}h`;

    return `${formattedHours} ${formattedMinutes}`;
  }
}
