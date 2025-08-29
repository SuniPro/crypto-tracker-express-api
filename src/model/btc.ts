import { BigNumber } from "bignumber.js";

export interface BTCBalanceResponseType {
  address: string;
  total_received: BigNumber;
  total_sent: BigNumber;
  balance: BigNumber;
  unconfirmed_balance: BigNumber;
  final_balance: BigNumber;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
}

interface TransactionRef {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: BigNumber; // 사토시 단위 금액
  ref_balance: BigNumber; // 거래 후 잔액 (사토시)
  spent: boolean;
  confirmed: string; // ISO 8601 형식의 날짜 문자열
  double_spend: boolean;
}

// 전체 API 응답을 위한 메인 인터페이스
export interface BlockCypherAddressResponse {
  address: string;
  total_received: BigNumber;
  total_sent: BigNumber;
  balance: BigNumber;
  unconfirmed_balance: BigNumber;
  final_balance: BigNumber;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
  txrefs?: TransactionRef[]; // 거래 내역이 없을 수도 있으므로 optional
}

interface TransactionInput {
  prev_hash: string;
  output_index: number;
  script: string;
  output_value: BigNumber; // 입력으로 사용된 금액 (사토시)
  sequence: number;
  addresses: string[];
  script_type: string;
  age: number;
}

// 'outputs' 배열의 각 항목에 대한 인터페이스
interface TransactionOutput {
  value: BigNumber; // 출력으로 생성된 금액 (사토시)
  script: string;
  spent_by?: string; // 이 출력이 다른 거래에서 사용되었다면, 그 거래의 해시
  addresses: string[];
  script_type: string;
}

// 전체 API 응답을 위한 메인 인터페이스
export interface BlockCypherTransactionResponse {
  block_hash: string;
  block_height: number;
  block_index: number;
  hash: string;
  addresses: string[];
  total: BigNumber;
  fees: BigNumber;
  size: number;
  vsize: number;
  preference: string;
  confirmed: string; // ISO 8601 형식의 날짜 문자열
  received: string; // ISO 8601 형식의 날짜 문자열
  ver: number;
  double_spend: boolean;
  vin_sz: number;
  vout_sz: number;
  confirmations: number;
  confidence: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}
