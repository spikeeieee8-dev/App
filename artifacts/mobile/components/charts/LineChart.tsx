import React from "react";
import { Dimensions, Text, View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import Colors from "@/constants/colors";

type LineData = {
  label: string;
  value: number;
};

type Props = {
  data: LineData[];
  height?: number;
  width?: number;
  title?: string;
  color?: string;
  isDark?: boolean;
  textColor?: string;
};

export function LineChart({ data, height = 120, width, title, color = Colors.gold, isDark, textColor }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = (width || screenWidth - 64) - 8;
  const chartHeight = height;
  const padLeft = 4;
  const padBottom = 24;
  const padTop = 8;
  const innerW = chartWidth - padLeft * 2;
  const innerH = chartHeight - padBottom - padTop;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const tc = textColor || (isDark ? Colors.mutedGray : "#999");

  if (data.length < 2) return null;

  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - (d.value / maxVal) * innerH,
  }));

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  const fillPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`;

  return (
    <View>
      {title && (
        <Text style={[styles.title, { color: isDark ? Colors.offWhite : Colors.charcoal }]}>{title}</Text>
      )}
      <Svg width={chartWidth + padLeft} height={chartHeight}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {[0, 0.5, 1].map((frac) => {
          const y = padTop + innerH * (1 - frac);
          return (
            <Line
              key={frac}
              x1={padLeft}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={isDark ? "#333" : "#eee"}
              strokeWidth={1}
            />
          );
        })}

        <Path d={fillPath} fill="url(#lineGrad)" />
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />

        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}

        {data.map((d, i) => (
          <SvgText
            key={i}
            x={points[i].x}
            y={chartHeight - 4}
            textAnchor="middle"
            fontSize={9}
            fill={tc}
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});
