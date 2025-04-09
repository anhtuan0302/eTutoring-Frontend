import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListClasses from "../../../components/common/education/classInfo/list";
import CreateClass from "../../../components/common/education/classInfo/create";
import DetailClass from "../../../components/common/education/classInfo/detail";
import UpdateClass from "../../../components/common/education/classInfo/update";

import CreateSchedule from "../../../components/common/education/classSchedule/create";

export const ListClassesPage = () => {
  return (
    <AppLayout title="List Classes">
      <ListClasses />
    </AppLayout>
  );
};

export const CreateClassPage = () => {
  return (
    <AppLayout title="Create Class">
      <CreateClass />
    </AppLayout>
  );
};

export const DetailClassPage = () => {
  return (
    <AppLayout title="Detail Class">
      <DetailClass />
    </AppLayout>
  );
};

export const UpdateClassPage = () => {
  return (
    <AppLayout title="Update Class">
      <UpdateClass />
    </AppLayout>
  );
};

export const CreateSchedulePage = () => {
  return (
    <AppLayout title="Create Schedule">
      <CreateSchedule />
    </AppLayout>
  );
};
