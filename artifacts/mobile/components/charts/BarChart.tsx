import React from "react";
import { Dimensions, Text, View, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import Colors from "@/constants/colors";

type BarData = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: BarData[];
  height?: number;
  width?: number;
  title?: string;
  valuePrefix?: string;
  isDark?: boolean;
  textColor?: string;
  gridColor?: string;
};

export function BarChart({ data, height = 160, width, title, valuePrefix = "", isDark, textColor, gridColor }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = (width || screenWidth - 64) - 8;
  const chartHeight = height;
  const padLeft = 4;
  const padBottom = 28;
  const padTop = 8;
  const innerH = chartHeight - padBottom - padTop;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barCount = data.length;
  const gap = 6;
  const barWidth = Math.max(8, (chartWidth - padLeft - gap * (barCount + 1)) / barCount);

  const tc = textColor || (isDark ? Colors.mutedGray : "#999");
  const gc = gridColor || (isDark ? "#333" : "#eee");

  return (
    <View>
      {title && (
        <Text style={[styles.title, { color: isDark ? Colors.offWhite : Colors.charcoal }]}>{title}</Text>
      )}
      <Svg width={chartWidth + padLeft} height={chartHeight}>
        {[0, 0.5, 1].map((frac) => {
          const y = padTop + innerH * (1 - frac);
          return (
            <Line
              key={frac}
              x1={padLeft}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke={gc}
              strokeWidth={1}
            />
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / maxVal) * innerH);
          const x = padLeft + gap + i * (barWidth + gap);
          const y = padTop + innerH - barH;
          const color = d.color || Colors.gold;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                ry={4}
                fill={color}
                opacity={0.9}
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 4}
                textAnchor="middle"
                fontSize={9}
                fill={tc}
                fontWeight="400"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
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
