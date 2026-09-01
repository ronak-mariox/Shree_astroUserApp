import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

export type FormIconProps = {
  size?: number;
  color?: string;
};

/**
 * Small glyphs used on the account-creation wizard's fields — the "Other"
 * gender option (Figma node 518:7879) and the three Birth Details field
 * labels (nodes 518:7949, 518:7967, 522:7983).
 */

/** Gender-neutral figure, replacing the old "⚧" text glyph. */
export function OtherGenderIcon({ size = 14, color = colors.text.secondary }: FormIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7.10938 5.79687C7.10938 7.60905 5.64031 9.07812 3.82813 9.07812C2.01595 9.07812 0.546875 7.60905 0.546875 5.79687C0.546875 3.98469 2.01595 2.51562 3.82813 2.51562C5.64031 2.51562 7.10938 3.98469 7.10938 5.79687Z"
        stroke={color}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.82812 9.07812V13.4531" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M4.96724 6.34375C4.93741 6.16591 4.92188 5.9832 4.92188 5.79688C4.92188 5.61055 4.93741 5.42784 4.96724 5.25"
        stroke={color}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.98438 2.73437C9.79655 2.73437 11.2656 4.20344 11.2656 6.01562C11.2656 7.8278 9.79655 9.29688 7.98438 9.29688"
        stroke={color}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.2656 0.546875H12.3594C12.9635 0.546875 13.4531 1.03657 13.4531 1.64062V2.73438"
        stroke={color}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.37533 12.3594L4.60194 13.1328C4.1748 13.5599 3.48229 13.5599 3.05513 13.1328L2.28174 12.3594"
        stroke={color}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10.3047 3.69531L13.1329 0.867121" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Calendar, for the Date of Birth field label. */
export function CalendarIcon({ size = 15, color = colors.text.primary }: FormIconProps) {
  return (
    <Svg width={size} height={size * (14 / 15)} viewBox="0 0 15 14" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.33317 10.666C1.70136 10.666 1.99984 10.9645 1.99984 11.3326V12.6659H12.6665V11.3326C12.6665 10.9645 12.965 10.666 13.3332 10.666C13.7014 10.666 13.9998 10.9645 13.9998 11.3326V13.3325C13.9998 13.7007 13.7014 13.9992 13.3332 13.9992H1.33317C0.964984 13.9992 0.666504 13.7007 0.666504 13.3325V11.3326C0.666504 10.9645 0.964984 10.666 1.33317 10.666Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.33334 1.33264C1.33334 0.964478 1.63181 0.666016 2.00001 0.666016H12.6667C13.0349 0.666016 13.3333 0.964478 13.3333 1.33264V4.59977L14.6537 11.2013C14.6929 11.3972 14.6422 11.6002 14.5156 11.7547C14.3889 11.9092 14.1997 11.9987 14 11.9987H0.666672C0.466946 11.9987 0.277739 11.9092 0.151112 11.7547C0.0244858 11.6002 -0.0262189 11.3972 0.0129525 11.2013L1.33334 4.59977V1.33264ZM2.66667 1.99927V4.66578C2.66667 4.70968 2.66233 4.75347 2.65373 4.79652L1.47987 10.6654H13.1868L12.0129 4.79652C12.0043 4.75347 12 4.70968 12 4.66578V1.99927H2.66667Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 1.33264C1.3335 0.964478 1.63198 0.666016 2.00016 0.666016H12.6668C13.035 0.666016 13.3335 0.964478 13.3335 1.33264V4.66578C13.3335 5.03395 13.035 5.33241 12.6668 5.33241H2.00016C1.63198 5.33241 1.3335 5.03395 1.3335 4.66578V1.33264ZM2.66683 1.99927V3.99916H12.0002V1.99927H2.66683Z"
        fill={color}
      />
      <Path fillRule="evenodd" clipRule="evenodd" d="M4.99984 0V2.66651H3.6665V0H4.99984Z" fill={color} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M11.0003 0V2.66651H9.66699V0H11.0003Z" fill={color} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M7.99984 0V2.66651H6.6665V0H7.99984Z" fill={color} />
    </Svg>
  );
}

/** Clock face, for the Time of Birth field label. */
export function ClockIcon({ size = 16, color = colors.text.primary }: FormIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346627 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C15.9975 5.87903 15.1539 3.84565 13.6541 2.3459C12.1544 0.846145 10.121 0.00249086 8 0ZM8 14.1176C6.79005 14.1176 5.60726 13.7589 4.60122 13.0866C3.59518 12.4144 2.81106 11.459 2.34803 10.3411C1.885 9.22327 1.76385 7.99321 1.9999 6.8065C2.23596 5.6198 2.8186 4.52974 3.67417 3.67417C4.52974 2.8186 5.6198 2.23595 6.80651 1.9999C7.99322 1.76385 9.22327 1.885 10.3411 2.34803C11.459 2.81106 12.4144 3.59518 13.0866 4.60122C13.7589 5.60726 14.1176 6.79004 14.1176 8C14.1152 9.62173 13.4698 11.1763 12.3231 12.3231C11.1763 13.4698 9.62174 14.1152 8 14.1176Z"
        fill={color}
      />
      <Path
        d="M10.8233 7.53033H8.94095V4.7068C8.94095 4.45719 8.84179 4.21779 8.66528 4.04129C8.48878 3.86478 8.24939 3.76562 7.99977 3.76562C7.75015 3.76562 7.51076 3.86478 7.33426 4.04129C7.15775 4.21779 7.05859 4.45719 7.05859 4.7068V8.47151C7.05859 8.72112 7.15775 8.96051 7.33426 9.13702C7.51076 9.31352 7.75015 9.41268 7.99977 9.41268H10.8233C11.0729 9.41268 11.3123 9.31352 11.4888 9.13702C11.6653 8.96051 11.7645 8.72112 11.7645 8.47151C11.7645 8.22189 11.6653 7.9825 11.4888 7.80599C11.3123 7.62949 11.0729 7.53033 10.8233 7.53033Z"
        fill={color}
      />
    </Svg>
  );
}

/** Location pin, for the Place of Birth field label. */
export function LocationPinIcon({ size = 14, color = colors.text.primary }: FormIconProps) {
  return (
    <Svg width={size} height={size * (16 / 14)} viewBox="0 0 14 16" fill="none">
      <Path
        d="M13.4729 6.73671C13.4729 3.0197 10.458 0 6.73696 0C3.01822 0.00152961 0 3.0162 0 6.73849C0 8.59687 0.754099 10.2812 1.97384 11.5001L6.73696 16L11.5009 11.4983C12.7196 10.2814 13.4739 8.59712 13.4739 6.73671H13.4729ZM6.73696 10.1053C4.87606 10.1053 3.3686 8.5986 3.3686 6.73671C3.3686 4.87655 4.87606 3.36836 6.73696 3.36836C8.59712 3.36836 10.1053 4.87655 10.1053 6.73671C10.1053 8.5986 8.59712 10.1053 6.73696 10.1053Z"
        fill={color}
      />
    </Svg>
  );
}
