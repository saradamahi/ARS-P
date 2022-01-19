/**
 * Custom Task model
 *
 * Taken from the vanilla dragfromgrid example
 */
import { SchedulerEventModel } from "@bryntum/schedulerpro/schedulerpro.umd";

export default class Task extends SchedulerEventModel {
  static get defaults() {
    return {
      // in this demo, default duration for tasks will be hours (instead of days)
      duration: 3,
      durationUnit: "h",
    };
  }
}
