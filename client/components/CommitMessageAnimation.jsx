import React from 'react'

export default function CommitMessage({animate, width, height}) {
  return <svg id="commitmessage" width={width} height={height}>
    <g transform="translate(-50, -50)">
      <path id="commitmessage_branch"
            d="m89.5,97c0,78 18,115 100.5,111"
            className={animate ? 'grow' : ''}
            strokeDasharray="200"
            strokeDashoffset="200"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <line id="svg_6"
            y2="94"
            x2="190.5"
            y1="94"
            x1="76.5"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <ellipse ry="25"
               rx="25"
               id="svg_1"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_2"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_4"
               cy="92.5"
               cx="190.506577"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse stroke="#fff"
               className={animate ? 'grow' : ''}
               ry="25"
               rx="25"
               id="commitmessage_commit"
               cy="205.5"
               cx="191.5"
               strokeWidth="4"
               fill="#fff"/>
    </g>
  </svg>
}
