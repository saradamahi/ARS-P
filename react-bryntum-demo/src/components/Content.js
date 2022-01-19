/**
 * Contains scheduler and equipment grid
 */
import React, { useEffect, useRef, useState } from "react";
import { BryntumScheduler, BryntumSplitter } from "@bryntum/schedulerpro-react";
import UnplannedGridComponent from "./UnplannedGrid";
import TaskStore from "../lib/TaskStore";
import Drag from "../lib/Drag.js";
import { getResourceEvents, getResources } from "../services/dataService";

const Content = (props) => {
  const scheduler = useRef(null);

  const grid = useRef(null);
  const [eventStore] = useState(new TaskStore());

  useEffect(() => {
    const resources = async () => {
      const { data } = await getResources();
      scheduler.current.instance.resourceStore.data = data;
    };

    const resourceEvents = async () => {
      const { data } = await getResourceEvents();
      scheduler.current.instance.eventStore.data = data;
    };

    resources();
    resourceEvents();
  }, []);

  useEffect(() => {
    new Drag({
      grid: grid.current.unplannedGrid,
      schedule: scheduler.current.instance,
      constrain: false,
      outerElement: grid.current.unplannedGrid.element,
    });
    //   scheduler2Ref.current.instance.addPartner(scheduler1Ref.current.instance);
  }, [eventStore]);

  return (
    <div id="content">
      <BryntumScheduler
        ref={scheduler}
        id="schedulerComponent"
        stripeFeature={true}
        timeRangesFeature={true}
        eventMenuFeature={{
          items: {
            // custom item with inline handler
            unassign: {
              text: "Unassign",
              icon: "b-fa b-fa-user-times",
              weight: 200,
              onItem: ({ eventRecord, resourceRecord }) =>
                eventRecord.unassign(resourceRecord),
            },
          },
        }}
        rowHeight={50}
        barMargin={4}
        eventColor="indigo"
        resourceImagePath="users/"
        columns={[
          {
            type: "resourceInfo",
            text: "Name",
            width: 200,
            showEventCount: false,
            showRole: true,
          },
        ]}
        // Custom view preset with header configuration
        viewPreset={{
          base: "hourAndDay",
          columnLinesFor: 0,
          headers: [
            {
              unit: "d",
              align: "center",
              dateFormat: "ddd DD MMM",
            },
            {
              unit: "h",
              align: "center",
              dateFormat: "HH",
            },
          ],
        }}
        startDate={new Date(2025, 11, 1, 8)}
        endDate={new Date(2025, 11, 1, 18)}
        crudManager={{
          autoLoad: true,
          eventStore: eventStore,
          // This config enables response validation and dumping of found errors to the browser console.
          // It's meant to be used as a development stage helper only so please set it to false for production systems.
          validateResponse: true,
        }}
      />
      <BryntumSplitter />
      <UnplannedGridComponent ref={grid} eventStore={eventStore} />
    </div>
  );
};

export default Content;
