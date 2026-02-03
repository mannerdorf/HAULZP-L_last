export type OperationType =
  | 'REVENUE'
  | 'COGS'
  | 'OPEX'
  | 'CAPEX'
  | 'BELOW_EBITDA_DIVIDENDS'
  | 'BELOW_EBITDA_TRANSIT';

export type Department =
  | 'LOGISTICS_MSK'
  | 'LOGISTICS_KGD'
  | 'ADMINISTRATION'
  | 'DIRECTION'
  | 'IT'
  | 'SALES'
  | 'SERVICE'
  | 'GENERAL';

export type LogisticsStage =
  | 'PICKUP'
  | 'DEPARTURE_WAREHOUSE'
  | 'MAINLINE'
  | 'ARRIVAL_WAREHOUSE'
  | 'LAST_MILE';

export type Direction = 'MSK_TO_KGD' | 'KGD_TO_MSK';
