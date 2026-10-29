# Event Cloud Manager — Project Overview

## 1. Project Abstract
**Event Cloud Manager** is a cloud-based web application designed for engineering colleges and universities to automate the management of campus events, student registrations, rotating QR-code attendance capture, verified participation hours, and accreditation reports (NAAC/NBA).

## 2. Problem Statement & Existing System Limitations
Traditional college event management faces severe bottlenecks:
1. **Paper Rosters & Manual Sheets**: Physical sign-in sheets take valuable event time and are prone to handwriting illegibility and physical damage.
2. **Buddy Attendance / Proxy Marking**: Static attendance links or sign-ins allow absent students to mark attendance remotely.
3. **Unverified Duration**: Single-tap attendance fails to capture actual student presence throughout multi-hour or multi-day sessions.
4. **Labor-Intensive Reporting**: Collating attendance lists, computing participation hours, and issuing participation certificates requires days of manual administrative effort.

## 3. The Proposed Cloud Solution
Event Cloud Manager delivers:
- **Centralized Event Scheduling**: Real-time event creation, coordinator delegation, and capacity management.
- **Dynamic Rotating QR Codes**: 60-second HMAC-signed tokens prevent screenshot forwarding and proxy marking.
- **Two-Phase Check-In & Check-Out**: Verifies arrival and departure, computing exact participation seconds:
  $$\text{Verified Duration} = \text{Check-Out Timestamp} - \text{Check-In Timestamp}$$
  $$\text{Attendance Percentage} = \min\left(100\%, \frac{\text{Verified Duration}}{\text{Eligible Event Duration}} \times 100\right)$$
- **Instant Reporting**: On-demand CSV and official PDF report exports with digital verification formatting.
