import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

export default function ECGWaveform({ data = [], width, height, color = '#34D399', showGrid = true, bg = colors.surface, gridColor = colors.border }) {
  const points = useMemo(() => {
    if (data.length < 2) return '';
    const stepX = width / (data.length - 1);
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;
    return data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - minVal) / range) * (height * 0.8) - height * 0.1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const lines = [];
    const hGap = width / 12;
    const vGap = height / 6;
    for (let i = 0; i <= 12; i++)
      lines.push({ x1: i * hGap, y1: 0, x2: i * hGap, y2: height, key: `v${i}` });
    for (let i = 0; i <= 6; i++)
      lines.push({ x1: 0, y1: i * vGap, x2: width, y2: i * vGap, key: `h${i}` });
    return lines;
  }, [width, height, showGrid]);

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={bg} rx={12} />
        {gridLines.map((l) => (
          <Line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {points ? (
          <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: 'hidden' },
});
