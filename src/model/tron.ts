import { BigNumber } from "bignumber.js";

// contract 배열 안에 들어갈 객체의 타입을 먼저 정의합니다.
interface ContractParameterValue {
  amount: BigNumber;
  owner_address: string; // ex: "41a357353aee3639265412a4eb411fda90e0f1132d"
  to_address: string; // ex: "4182a2ca2a04c10ff219670400cf48414502b04ad3"
}

interface ContractParameter {
  value: ContractParameterValue;
  type_url: string;
}

interface Contract {
  parameter: ContractParameter;
  type: string;
}

// 최종 트랜잭션 응답 타입입니다.
export interface TronTransactionResponse {
  ret: [{ contractRet: string; fee: number }];
  signature: string[];
  txID: string;
  net_usage: number;
  raw_data_hex: string;
  net_fee: number;
  energy_usage: number;
  blockNumber: number;
  block_timestamp: number;
  energy_fee: number;
  energy_usage_total: number;
  raw_data: {
    contract: Contract[]; // ✅ 수정된 부분: Contract 객체의 배열
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
  };
  internal_transactions: any[]; // ✅ 수정된 부분: 비어있지 않을 수도 있음
}

export interface TronTransferResponse {
  transaction_id: string;
  token_info: {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
  };
  block_timestamp: number;
  from: string;
  to: string;
  type: string;
  value: string;
}

export interface TronAccount {
  address?: string;
  balance?: number;
  create_time?: number;
  latest_opration_time?: number;
  latest_consume_time?: number;
  latest_consume_free_time?: number;
  net_window_size?: number;
  net_window_optimized?: boolean;
  account_resource?: {
    latest_consume_time_for_energy?: number;
    energy_window_size?: number;
    energy_window_optimized?: boolean;
  };
  owner_permission?: {
    permission_name: string;
    threshold: number;
    keys: { address: string; weight: number }[];
  };
  active_permission?: {
    type: string;
    id: number;
    permission_name: string;
    threshold: number;
    operations: string;
    keys: { address: string; weight: number }[];
  }[];
  frozenV2?: { type?: string }[];
  asset_optimized?: boolean;
  [key: string]: any; // 확장 가능
}
