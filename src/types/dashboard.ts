
export interface Widget {
  id: string;
  type: string;
  title: string;
  width: 1 | 2 | 3 | 4; // Column width (out of 4)
  height: 1 | 2; // Row height (1 = normal, 2 = double)
  data?: any;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
}

export interface NewWidgetData {
  type: string;
  title: string;
  width: 1 | 2 | 3 | 4;
  height: 1 | 2;
}

export interface NewDashboardData {
  name: string;
  description: string;
}

