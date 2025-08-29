export interface ExchangeInfoResponse {
  status: string;
  data: ExchangeInfo;
}

export interface ExchangeInfo {
  // 시가 00시 기준
  opening_price: BigNumber;
  // 종가 00시 기준
  closing_price: BigNumber;
  // 저가 00시 기준
  min_price: BigNumber;
  // 고가 00시 기준
  max_price: BigNumber;
  // 거래량 00시 기준
  units_traded: BigNumber;
  // 거래금액 00시 기준
  acc_trade_value: BigNumber;
  // 전일 종가
  prev_closing_price: BigNumber;
  // 최근 24시간 거래량
  units_traded_24H: number;
  // 최근 24시간 거래금액
  acc_trade_value_24H: BigNumber;
  // 최근 24시간 변동가
  fluctate_24H: BigNumber;
  // 최근 24시간 변동률
  fluctate_rate_24H: number;
  date: number;
}
