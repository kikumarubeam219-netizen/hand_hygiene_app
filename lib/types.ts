// 手指衛生記録のデータ型定義

export type TimingType = 1 | 2 | 3 | 4 | 5;

export type ActionType = 'hand_sanitizer' | 'hand_wash' | 'no_action';

export interface UserInfo {
  userName?: string;
  facilityName?: string;
  department?: string;
  ward?: string;
  section?: string;
  observer?: string;
  address?: string;
}

export interface HygieneRecord {
  id: string;
  timing: TimingType;
  action: ActionType;
  timestamp: number; // Unix timestamp
  notes?: string;
  userName?: string;
  facilityName?: string;
}

export interface TimingInfo {
  id: TimingType;
  name: string;
  description: string;
  reason: string;
  examples: string[];
}

export const TIMING_INFO: Record<TimingType, TimingInfo> = {
  1: {
    id: 1,
    name: '患者に触れる前',
    description: '握手、介助、検査の前',
    reason: '手指を介して伝播する病原微生物から患者を守るため',
    examples: [
      '握手の前',
      '移動などの介助の前',
      '入浴や清拭の前',
      '脈拍測定の前',
      '血圧測定の前',
    ],
  },
  2: {
    id: 2,
    name: '清潔／無菌操作の前',
    description: '口腔ケア、注射、ドレッシング交換の前',
    reason: '患者の体内に微生物が侵入することを防ぐため',
    examples: [
      '口腔／歯科ケアの前',
      '分泌物の吸引前',
      '損傷皮膚のケアの前',
      '創部ドレッシングを行う前',
      '皮下注射、カテーテル挿入の前',
    ],
  },
  3: {
    id: 3,
    name: '体液に曝露された可能性のある場合',
    description: '採血、吸引、ドレーン処理の後',
    reason: '患者の病原微生物から自分自身と医療環境を守るため',
    examples: [
      '口腔／歯科ケアの後',
      '分泌物の吸引後',
      '損傷皮膚のケアの後',
      '液状検体の採取および処理をした後',
      '尿、糞便、吐物を処理した後',
    ],
  },
  4: {
    id: 4,
    name: '患者に触れた後',
    description: '握手、介助、検査の後',
    reason: '患者の病原微生物から自分自身と医療環境を守るため',
    examples: [
      '握手の後',
      '移動などの介助の後',
      '入浴や清拭の後',
      '脈拍測定の後',
      '血圧測定の後',
    ],
  },
  5: {
    id: 5,
    name: '患者周辺の物品に触れた後',
    description: 'ベッド、点滴、アラーム確認の後',
    reason: '患者の病原微生物から自分自身と医療環境を守るため',
    examples: [
      'ベッドリネンの交換の後',
      '点滴速度調整の後',
      'アラームを確認した後',
      'ベッド柵をつかんだ後',
      'ベッドサイドテーブルを掃除した後',
    ],
  },
};

export const ACTION_LABELS: Record<ActionType, string> = {
  hand_sanitizer: '手指消毒',
  hand_wash: '手洗い',
  no_action: '実施なし',
};
