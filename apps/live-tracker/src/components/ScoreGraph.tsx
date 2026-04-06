import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface JamScore {
  jam: number
  team1Score: number
  team2Score: number
  team1Total: number
  team2Total: number
  period: number
  isIntermission?: boolean
}

interface ScoreGraphProps {
  data: JamScore[]
  team1Name: string
  team2Name: string
}

export function ScoreGraph({ data, team1Name, team2Name }: ScoreGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svgRef.current.parentElement
    if (!container) return

    const margin = { top: 20, right: 20, bottom: 50, left: 60 }
    const width = container.clientWidth - margin.left - margin.right
    const height = 450 - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const jamDataOnly = data.filter((d) => !d.isIntermission)

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(data.length - 1, 10)])
      .range([0, width])

    const maxScore = Math.max(
      d3.max(jamDataOnly, (d: JamScore) => d.team1Total) || 100,
      d3.max(jamDataOnly, (d: JamScore) => d.team2Total) || 100,
      100
    )

    const yScale = d3
      .scaleLinear()
      .domain([0, maxScore * 1.1])
      .range([height, 0])

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(data.length, 10))
      .tickFormat((d) => `J${d}`)

    const yAxis = d3.axisLeft(yScale).ticks(8)

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('color', 'oklch(0.65 0.01 270)')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '13px')
      .style('font-weight', '500')

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .attr('color', 'oklch(0.65 0.01 270)')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '13px')
      .style('font-weight', '500')

    g.selectAll('.domain').style('stroke', 'oklch(0.3 0.02 270)')
    g.selectAll('.tick line').style('stroke', 'oklch(0.3 0.02 270)')

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(() => ''))
      .select('.domain')
      .remove()

    data.forEach((d, i) => {
      if (d.isIntermission && i > 0) {
        const xPos = xScale(i)
        g.append('rect')
          .attr('x', xPos - 10)
          .attr('y', 0)
          .attr('width', 20)
          .attr('height', height)
          .attr('fill', 'oklch(0.88 0.19 95)')
          .attr('opacity', 0.15)
          .attr('stroke', 'oklch(0.88 0.19 95)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')

        g.append('text')
          .attr('x', xPos)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('transform', `rotate(-90, ${xPos}, ${height / 2})`)
          .style('font-family', 'Inter, sans-serif')
          .style('font-size', '12px')
          .style('font-weight', '700')
          .style('fill', 'oklch(0.88 0.19 95)')
          .text('INTERMISSION')
      }
    })

    const line1 = d3
      .line<JamScore>()
      .x((d: JamScore, i: number) => xScale(data.indexOf(d)))
      .y((d: JamScore) => yScale(d.team1Total))
      .curve(d3.curveMonotoneX)

    const line2 = d3
      .line<JamScore>()
      .x((d: JamScore, i: number) => xScale(data.indexOf(d)))
      .y((d: JamScore) => yScale(d.team2Total))
      .curve(d3.curveMonotoneX)

    const path1 = g
      .append('path')
      .datum(jamDataOnly)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.65 0.22 240)')
      .attr('stroke-width', 3)
      .attr('d', line1)

    const path2 = g
      .append('path')
      .datum(jamDataOnly)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.62 0.28 330)')
      .attr('stroke-width', 3)
      .attr('d', line2)

    const totalLength1 = path1.node()?.getTotalLength() || 0
    const totalLength2 = path2.node()?.getTotalLength() || 0

    path1
      .attr('stroke-dasharray', `${totalLength1} ${totalLength1}`)
      .attr('stroke-dashoffset', totalLength1)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)

    path2
      .attr('stroke-dasharray', `${totalLength2} ${totalLength2}`)
      .attr('stroke-dashoffset', totalLength2)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)

    g.selectAll('.dot1')
      .data(jamDataOnly)
      .enter()
      .append('circle')
      .attr('class', 'dot1')
      .attr('cx', (d: JamScore, i: number) => xScale(data.indexOf(d)))
      .attr('cy', (d: JamScore) => yScale(d.team1Total))
      .attr('r', 4)
      .attr('fill', 'oklch(0.65 0.22 240)')
      .attr('stroke', 'oklch(0.15 0.01 270)')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .delay((d: JamScore, i: number) => i * 50)
      .duration(300)
      .style('opacity', 1)

    g.selectAll('.dot2')
      .data(jamDataOnly)
      .enter()
      .append('circle')
      .attr('class', 'dot2')
      .attr('cx', (d: JamScore, i: number) => xScale(data.indexOf(d)))
      .attr('cy', (d: JamScore) => yScale(d.team2Total))
      .attr('r', 4)
      .attr('fill', 'oklch(0.62 0.28 330)')
      .attr('stroke', 'oklch(0.15 0.01 270)')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .delay((d: JamScore, i: number) => i * 50)
      .duration(300)
      .style('opacity', 1)

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'oklch(0.65 0.01 270)')
      .text('Jam Number')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'oklch(0.65 0.01 270)')
      .text('Cumulative Score')

  }, [data, team1Name, team2Name])

  return <svg ref={svgRef} className="w-full" />
}
