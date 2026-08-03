declare module 'react-d3-speedometer' {
  export type CustomSegmentLabelPosition = 'INSIDE' | 'OUTSIDE';

  export interface CustomSegmentLabel {
    text: string;
    position: CustomSegmentLabelPosition;
    color: string;
    fontSize: string;
  }

  export interface ReactSpeedometerProps {
    value: number;
    minValue?: number;
    maxValue?: number;
    segments?: number;
    segmentColors?: string[];
    currentValueText?: string;
    valueTextFontSize?: string;
    textColor?: string;
    paddingHorizontal?: number;
    paddingVertical?: number;
    valueTextFontWeight?: string;
    needleTransitionDuration?: number;
    needleTransition?: 'easeQuad' | 'easeElastic' | 'easeLinear';
    needleColor?: string;
    startColor?: string;
    endColor?: string;
    labelFontSize?: string;
    customSegmentLabels?: CustomSegmentLabel[];
    ringWidth?: number;
    needleHeightRatio?: number;
    customSegmentStops?: number[];
  }

  const ReactSpeedometer: React.FC<ReactSpeedometerProps>;
  export default ReactSpeedometer;
}
