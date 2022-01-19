/**
 * Unplanned grid component
 *
 * Taken from the vanilla dragfromgrid example
 */
import { Grid } from "@bryntum/schedulerpro/schedulerpro.umd";

export default class UnplannedGrid extends Grid {
  /**
   * Original class name getter. See Widget.$name docs for the details.
   * @return {string}
   */
  static get $name() {
    return "UnplannedGrid";
  }

  static get defaultConfig() {
    return {
      features: {
        stripe: true,
        sort: { field: "serviceOrderId", ascending: false },
      },

      columns: [
        {
          text: "ID",
          width: 80,
          field: "serviceOrderId",
        },
        {
          text: "Problem",
          width: 200,
          field: "problem",
        },
        {
          text: "Age",
          width: 40,
          field: "age",
        },
        {
          text: "Name",
          width: 400,
          field: "name",
        },
        {
          text: "Address",
          width: 200,
          field: "street",
        },
        {
          text: "City",
          width: 120,
          field: "city",
        },
        {
          text: "Zip",
          width: 80,
          field: "zip",
        },
        {
          text: "Event",
          width: 80,
          field: "event",
        },
        {
          text: "SL",
          width: 50,
          field: "serviceLine",
        },
        {
          text: "ST",
          width: 50,
          field: "serviceType",
        },
        {
          text: "SRC",
          width: 100,
          field: "source",
        },
        {
          text: "Due",
          width: 150,
          field: "due",
        },
        {
          text: "Tech",
          width: 150,
          field: "technician",
        },
        {
          text: "Priority",
          width: 150,
          field: "priority",
        },
        {
          text: "Elapsed",
          width: 80,
          field: "elapsed",
        },
        {
          text: "Codes",
          flex: 1,
          field: "codes",
        },
      ],

      rowHeight: 30,

      disableGridRowModelWarning: true,
    };
  }

  construct(config) {
    super.construct(config);

    this.eventStore.on({
      // When a task is updated, check if it was unassigned and if so - move it back to the unplanned tasks grid
      update: ({ record, changes }) => {
        if ("resourceId" in changes && !record.resourceId) {
          this.eventStore.remove(record);
          this.store.add(record);
        }
      },
      thisObj: this,
    });
  }
}
