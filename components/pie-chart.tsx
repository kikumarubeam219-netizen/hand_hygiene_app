import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from './themed-text';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  showPercentage = true,
}: PieChartProps) {
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  // 合計値を計算
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // パスを生成
  let currentAngle = -Math.PI / 2;
  const paths: Array<{
    d: string;
    color: string;
    label: string;
    percentage: number;
  }> = [];

  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;

    // 大きい弧フラグ
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    // 開始点と終了点を計算
    const startX = centerX + radius * Math.cos(currentAngle);
    const startY = centerY + radius * Math.sin(currentAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    // パスを生成
    const pathData = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

    const percentage = Math.round((item.value / total) * 100);
    paths.push({
      d: pathData,
      color: item.color,
      label: item.label,
      percentage,
    });

    currentAngle = endAngle;
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((path, index) => (
          <Path key={index} d={path.d} fill={path.color} strokeWidth={0} />
        ))}
      </Svg>

      {showLegend && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: item.color },
                ]}
              />
              <View style={styles.legendText}>
                <ThemedText type="default" style={{ fontSize: 12 }}>
                  {item.label}
                </ThemedText>
                {showPercentage && (
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ fontSize: 12, marginTop: 2 }}
                  >
                    {Math.round((item.value / total) * 100)}% ({item.value})
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    width: '100%',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    flex: 1,
  },
});
