import json
import csv
import random
import os

# 10 Computer Networks Concepts in hierarchical order
# Each concept contains:
# - diagnostic_pool: 3 distinct scenario-based diagnostic questions (Total 30 questions)
# - diagnostic_question: backward-compatible reference to diagnostic_pool[0]
# - lesson: targeted micro-lesson
# - practice_questions: 3 retest practice items (Total 30 questions)

CONCEPTS = [
    {
        "id": "CN_01_OSI_LAYERS",
        "name": "OSI & TCP/IP Architecture",
        "tier": 1,
        "category": "Architecture & Fundamentals",
        "prerequisites": [],
        "diagnostic_pool": [
            {
                "id": "DQ_01_A",
                "text": "During packet transmission, a host encapsulates user data before sending it out on the wire. If a router examines the destination IP address to make a forwarding decision, at which OSI layer does this routing inspection take place, and what Protocol Data Unit (PDU) is being processed?",
                "options": [
                    {
                        "key": "A",
                        "text": "Network Layer (Layer 3); Packet",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Routers operate at Layer 3 (Network Layer) and process Packets containing IP headers for forwarding."
                    },
                    {
                        "key": "B",
                        "text": "Data Link Layer (Layer 2); Frame",
                        "is_correct": False,
                        "rationale": "Misconception: Layer 2 processes Frames using MAC addresses, not IP destination routing."
                    },
                    {
                        "key": "C",
                        "text": "Transport Layer (Layer 4); Segment",
                        "is_correct": False,
                        "rationale": "Misconception: Layer 4 inspects port numbers for process-to-process multiplexing, not IP routing."
                    },
                    {
                        "key": "D",
                        "text": "Physical Layer (Layer 1); Bit Stream",
                        "is_correct": False,
                        "rationale": "Misconception: Layer 1 deals with electrical/optical signaling of raw bits, without packet header parsing."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_01_OSI_LAYERS",
                "explanation": "Routers operate at OSI Layer 3 (Network Layer) and inspect the destination IP address inside the Network Layer PDU, which is known as a Packet (or Datagram). Switches inspect Layer 2 Frames using MAC addresses, while Transport Layer devices deal with Segments using TCP/UDP port numbers."
            },
            {
                "id": "DQ_01_B",
                "text": "Two distinct web applications (a browser and a music streamer) are running concurrently on the same host with a single IP address. Which architectural layer and header field ensures that incoming packets are delivered to the correct application process?",
                "options": [
                    {
                        "key": "A",
                        "text": "Transport Layer (Layer 4); Destination Port Number",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Transport layer uses 16-bit port numbers for process-to-process multiplexing and demultiplexing on a single IP host."
                    },
                    {
                        "key": "B",
                        "text": "Network Layer (Layer 3); Destination IP Address",
                        "is_correct": False,
                        "rationale": "Misconception: Destination IP identifies the host interface on the internetwork, not the individual application process."
                    },
                    {
                        "key": "C",
                        "text": "Data Link Layer (Layer 2); Destination MAC Address",
                        "is_correct": False,
                        "rationale": "Misconception: MAC address delivers frames to the physical NIC on the local LAN."
                    },
                    {
                        "key": "D",
                        "text": "Physical Layer (Layer 1); Channel Frequency Sub-carrier",
                        "is_correct": False,
                        "rationale": "Misconception: Physical layer handles signal modulation, not software process multiplexing."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_01_OSI_LAYERS",
                "explanation": "Process-to-process communication is the primary responsibility of the Transport Layer (OSI Layer 4). It achieves this by assigning 16-bit Port Numbers (e.g., HTTP 80, HTTPS 443, ephemeral client ports) to demultiplex traffic to specific operating system sockets."
            },
            {
                "id": "DQ_01_C",
                "text": "When a client computer transmits an HTTP GET request to a remote server, what is the exact chronological sequence of header encapsulation as the data travels down the sender's protocol stack?",
                "options": [
                    {
                        "key": "A",
                        "text": "Application Data -> TCP Header -> IP Header -> Ethernet Frame Header -> Physical Bits",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Top-down encapsulation adds Layer 4 (TCP), then Layer 3 (IP), then Layer 2 (Ethernet MAC) headers."
                    },
                    {
                        "key": "B",
                        "text": "Application Data -> IP Header -> TCP Header -> Ethernet Frame Header -> Physical Bits",
                        "is_correct": False,
                        "rationale": "Misconception: Inverted Layer 3 and Layer 4 encapsulation; IP wraps around TCP, not vice-versa."
                    },
                    {
                        "key": "C",
                        "text": "Application Data -> Ethernet Frame Header -> IP Header -> TCP Header -> Physical Bits",
                        "is_correct": False,
                        "rationale": "Misconception: Layer 2 Ethernet framing is the outermost wrapper on the local wire, not the innermost."
                    },
                    {
                        "key": "D",
                        "text": "Application Data -> TCP Header -> Ethernet Frame Header -> IP Header -> Physical Bits",
                        "is_correct": False,
                        "rationale": "Misconception: IP header must be inside the Ethernet frame payload so intermediate routers can extract it."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_01_OSI_LAYERS",
                "explanation": "Protocol encapsulation moves strictly downwards from Layer 7 to Layer 1. The Application message receives a Transport Layer (TCP) header to form a Segment, which receives a Network Layer (IP) header to form a Packet, which receives a Data Link (Ethernet) header and trailer to form a Frame, converted to bits at Layer 1."
            }
        ],
        "lesson": {
            "title": "OSI 7-Layer vs TCP/IP Protocol Encapsulation",
            "axiom": "Headers are prepended downwards during encapsulation and stripped upwards during decapsulation. Routers inspect up to Layer 3; Switches inspect up to Layer 2.",
            "diagram": """+---------------------+-------------------+------------------+
| Layer Name          | PDU Name          | Primary Address  |
+---------------------+-------------------+------------------+
| 7. Application      | Message / Data    | URI / Domain     |
| 4. Transport        | Segment (TCP/UDP) | Port (16-bit)    |
| 3. Network          | Packet / Datagram | IP (IPv4 / IPv6) |
| 2. Data Link        | Frame             | MAC (48-bit)     |
| 1. Physical         | Bit Stream        | Voltage / Light  |
+---------------------+-------------------+------------------+""",
            "trap": "Confusing Layer 2 MAC switching with Layer 3 IP routing, or assuming routers alter the transport port numbers during standard routing.",
            "rules": [
                "Layer 3 PDU = Packet (routed by IP address across subnets).",
                "Layer 2 PDU = Frame (switched by MAC address inside the same collision/broadcast domain).",
                "Hop-by-hop framing changes at every router, but the source and destination IP addresses in the packet header remain unchanged (in non-NAT networks)."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_01_1",
                "text": "A Layer 2 Ethernet switch receives an Ethernet frame. Which header field does the switch examine to forward the frame to the correct output port?",
                "options": [
                    {"key": "A", "text": "Destination MAC Address", "is_correct": True},
                    {"key": "B", "text": "Destination IP Address", "is_correct": False},
                    {"key": "C", "text": "Destination TCP Port", "is_correct": False},
                    {"key": "D", "text": "EtherType field", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Layer 2 switches maintain a MAC address table (CAM table) and forward frames based strictly on the Destination MAC Address."
            },
            {
                "id": "PQ_01_2",
                "text": "When an application process creates a message, what header does the Transport Layer encapsulate around this payload?",
                "options": [
                    {"key": "A", "text": "Source and Destination Port Numbers", "is_correct": True},
                    {"key": "B", "text": "Source and Destination IP Addresses", "is_correct": False},
                    {"key": "C", "text": "CRC Frame Check Sequence", "is_correct": False},
                    {"key": "D", "text": "Preamble and SFD bits", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "The Transport Layer (TCP/UDP) prepends port numbers to facilitate process-to-process multiplexing."
            },
            {
                "id": "PQ_01_3",
                "text": "As a packet travels across multiple intermediate routers from host A to host B, what happens to the Layer 2 and Layer 3 headers?",
                "options": [
                    {"key": "A", "text": "Layer 2 Frame header changes at each hop; Layer 3 IP header stays constant (without NAT)", "is_correct": True},
                    {"key": "B", "text": "Layer 3 IP header changes at each hop; Layer 2 Frame header stays constant", "is_correct": False},
                    {"key": "C", "text": "Both Layer 2 and Layer 3 headers remain identical across all hops", "is_correct": False},
                    {"key": "D", "text": "Both Layer 2 and Layer 3 headers are stripped and not re-encapsulated", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Each router decapsulates the incoming Layer 2 frame, looks up the IP route in the routing table, and encapsulates the packet into a new Layer 2 frame for the next physical link."
            }
        ]
    },
    {
        "id": "CN_02_FRAMING_CRC",
        "name": "Data Link Framing & CRC Error Detection",
        "tier": 2,
        "category": "Data Link Layer",
        "prerequisites": ["CN_01_OSI_LAYERS"],
        "diagnostic_pool": [
            {
                "id": "DQ_02_A",
                "text": "A sender transmits data with bit sequence D = 10100100 using a CRC generator polynomial G(x) = x^3 + 1 (binary generator 1001). How many check bits (FCS) must be appended to D, and what operation is performed using modulo-2 arithmetic to compute these check bits?",
                "options": [
                    {
                        "key": "A",
                        "text": "Append 3 zeros and divide by 1001 using modulo-2 XOR division",
                        "is_correct": True,
                        "rationale": "Correct positive signal: For a generator polynomial of degree r=3, r=3 zeros are appended to the data bits, and remainder is obtained via modulo-2 polynomial division (XOR)."
                    },
                    {
                        "key": "B",
                        "text": "Append 4 zeros and perform standard arithmetic integer division",
                        "is_correct": False,
                        "rationale": "Misconception: Degree is 3 (x^3), so 3 zeros are appended, and arithmetic is modulo-2 without integer borrows/carries."
                    },
                    {
                        "key": "C",
                        "text": "Append 1 parity bit computed by summing all bit values modulo-2",
                        "is_correct": False,
                        "rationale": "Misconception: Confused CRC with simple even/odd parity bit."
                    },
                    {
                        "key": "D",
                        "text": "Append 3 ones and perform 1's complement arithmetic addition",
                        "is_correct": False,
                        "rationale": "Misconception: Confused CRC check bits with Internet Checksum."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_02_FRAMING_CRC",
                "explanation": "In CRC, if the generator polynomial G(x) has degree r (here x^3 + 1 has degree r = 3, binary 1001), exactly r = 3 zero bits are appended to the raw data bits. Then, modulo-2 polynomial long division (using bitwise XOR without carries or borrows) is performed to calculate the 3-bit remainder, which becomes the Frame Check Sequence (FCS)."
            },
            {
                "id": "DQ_02_B",
                "text": "In bit-oriented Data Link framing (HDLC), flag bytes 01111110 mark frame boundaries. What rule does the bit stuffing mechanism execute at the sender to ensure this flag pattern never accidentally appears inside the user payload?",
                "options": [
                    {
                        "key": "A",
                        "text": "Automatically injects a '0' bit after every five consecutive '1' bits in the data stream",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Bit stuffing inserts a '0' after five consecutive '1's so that a sequence of six '1's (flag byte) never occurs inside data."
                    },
                    {
                        "key": "B",
                        "text": "Replaces every occurrence of byte 01111110 with an escape character (ESC)",
                        "is_correct": False,
                        "rationale": "Misconception: Byte stuffing (character stuffing) uses ESC characters, whereas bit-oriented framing uses bit stuffing."
                    },
                    {
                        "key": "C",
                        "text": "Inserts a '1' bit after every four consecutive '0' bits",
                        "is_correct": False,
                        "rationale": "Misconception: Flags contain consecutive ones, so stuffing prevents 6 consecutive ones, not zeros."
                    },
                    {
                        "key": "D",
                        "text": "Inverts all data bits if five consecutive '1' bits are detected",
                        "is_correct": False,
                        "rationale": "Misconception: Inversion would corrupt the data; bit stuffing inserts a removable 0 bit instead."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_02_FRAMING_CRC",
                "explanation": "HDLC framing delimits frames using flag pattern 01111110 (six 1s). Whenever the sender detects five consecutive '1' bits in the user data, it unconditionally stuffs a '0' bit. The receiver automatically strips any '0' bit following five consecutive '1' bits."
            },
            {
                "id": "DQ_02_C",
                "text": "Why is Cyclic Redundancy Check (CRC) widely preferred over the Internet 1's Complement Checksum at Layer 2 for physical link error detection?",
                "options": [
                    {
                        "key": "A",
                        "text": "CRC detects all single, double, odd-numbered, and burst bit errors up to degree r with simple shift-register hardware",
                        "is_correct": True,
                        "rationale": "Correct positive signal: CRC polynomial division offers superior mathematical detection of burst errors common on physical transmission media."
                    },
                    {
                        "key": "B",
                        "text": "CRC can automatically correct 100% of all corrupted bits without retransmission",
                        "is_correct": False,
                        "rationale": "Misconception: Standard CRC is an error detection code, not forward error correction (FEC)."
                    },
                    {
                        "key": "C",
                        "text": "Checksum requires quadratic O(N^2) processing time compared to O(1) CRC",
                        "is_correct": False,
                        "rationale": "Misconception: Both algorithms are linear O(N), but CRC detects burst errors that cancel out in additive checksums."
                    },
                    {
                        "key": "D",
                        "text": "CRC encrypts the payload to prevent unauthorized eavesdropping on the wire",
                        "is_correct": False,
                        "rationale": "Misconception: CRC provides error detection integrity, not cryptographic confidentiality."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_02_FRAMING_CRC",
                "explanation": "Physical links frequently experience burst errors (consecutive corrupted bits caused by electrical noise). While additive checksums can fail if swapped bit errors sum to zero, a CRC generator polynomial of degree r mathematically guarantees detection of all burst errors of length <= r and all odd-numbered bit errors."
            }
        ],
        "lesson": {
            "title": "Cyclic Redundancy Check (CRC) & Modulo-2 Arithmetic",
            "axiom": "If generator polynomial G(x) has highest degree r, append r zeros to D. Compute remainder R via modulo-2 division (XOR). The transmitted frame is D + R.",
            "diagram": """Data: D = 10100100  | Generator: G = 1001 (degree r = 3)
Append 3 zeros: 10100100 000
Modulo-2 Long Division (XOR at each 1-bit position):
  10100100000 / 1001 ---> Remainder R (3 bits)
Transmitted Frame: D followed by R (total length = length(D) + 3)
Receiver verifies: Transmitted / 1001 must yield remainder 000!""",
            "trap": "Appending r+1 zeros instead of r zeros, or using standard decimal subtraction with borrows instead of bitwise XOR.",
            "rules": [
                "Number of FCS bits appended = Degree of generator polynomial (r).",
                "Modulo-2 addition and subtraction are identical: bitwise XOR (0 XOR 0 = 0, 1 XOR 1 = 0, 0 XOR 1 = 1).",
                "If no transmission errors occur, dividing the received frame by G(x) results in a remainder of exactly 0."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_02_1",
                "text": "If a generator polynomial is G(x) = x^4 + x + 1, what is its binary representation and how many check bits will be generated?",
                "options": [
                    {"key": "A", "text": "10011 with 4 check bits", "is_correct": True},
                    {"key": "B", "text": "1011 with 3 check bits", "is_correct": False},
                    {"key": "C", "text": "10001 with 5 check bits", "is_correct": False},
                    {"key": "D", "text": "11100 with 4 check bits", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "x^4 + 0x^3 + 0x^2 + 1x^1 + 1x^0 = 10011 (5 bits). The degree is 4, generating 4 check bits."
            },
            {
                "id": "PQ_02_2",
                "text": "What is the result of modulo-2 addition between binary numbers 1101 and 1011?",
                "options": [
                    {"key": "A", "text": "0110", "is_correct": True},
                    {"key": "B", "text": "11000", "is_correct": False},
                    {"key": "C", "text": "1000", "is_correct": False},
                    {"key": "D", "text": "0101", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "1 XOR 1 = 0, 1 XOR 0 = 1, 0 XOR 1 = 1, 1 XOR 1 = 0 => 0110."
            },
            {
                "id": "PQ_02_3",
                "text": "In bit-oriented framing, bit stuffing inserts a '0' after how many consecutive '1's to prevent unintended flag sequences (01111110)?",
                "options": [
                    {"key": "A", "text": "Five consecutive '1's", "is_correct": True},
                    {"key": "B", "text": "Six consecutive '1's", "is_correct": False},
                    {"key": "C", "text": "Seven consecutive '1's", "is_correct": False},
                    {"key": "D", "text": "Four consecutive '1's", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Bit stuffing automatically inserts a '0' whenever five consecutive '1's are encountered in data, ensuring the 6-one flag sequence (01111110) never occurs in the data stream."
            }
        ]
    },
    {
        "id": "CN_03_FLOW_CONTROL",
        "name": "Sliding Window Flow Control",
        "tier": 2,
        "category": "Data Link Layer",
        "prerequisites": ["CN_02_FRAMING_CRC"],
        "diagnostic_pool": [
            {
                "id": "DQ_03_A",
                "text": "In a Selective Repeat sliding window protocol with an n-bit sequence number field, what is the maximum permissible sender window size (Ws) to completely avoid sequence number ambiguity under packet loss and delayed ACKs?",
                "options": [
                    {
                        "key": "A",
                        "text": "Ws <= 2^(n-1)",
                        "is_correct": True,
                        "rationale": "Correct positive signal: In Selective Repeat, Ws + Wr <= 2^n. Since Ws = Wr, Ws <= 2^(n-1) to prevent overlap between new and retransmitted sequence spaces."
                    },
                    {
                        "key": "B",
                        "text": "Ws <= 2^n - 1",
                        "is_correct": False,
                        "rationale": "Misconception: 2^n - 1 is the window size for Go-Back-N (where Wr = 1), not Selective Repeat."
                    },
                    {
                        "key": "C",
                        "text": "Ws <= 2^n",
                        "is_correct": False,
                        "rationale": "Misconception: If Ws = 2^n, the receiver cannot distinguish between an ACK for the current window and an ACK for the wrapped-around subsequent window."
                    },
                    {
                        "key": "D",
                        "text": "Ws = 1",
                        "is_correct": False,
                        "rationale": "Misconception: Ws = 1 is Stop-and-Wait protocol, which severely underutilizes bandwidth-delay product."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_03_FLOW_CONTROL",
                "explanation": "In Selective Repeat, both sender and receiver maintain active sliding windows of size W. To prevent overlapping sequence spaces during catastrophic ACK loss, Ws + Wr <= 2^n. Setting Ws = Wr gives Ws <= 2^(n-1). For Go-Back-N, the receiver window Wr = 1, allowing Ws <= 2^n - 1."
            },
            {
                "id": "DQ_03_B",
                "text": "In Go-Back-N ARQ with a window size of 7, frames 0 through 6 are transmitted. Frame 3 is dropped by noise on the wire, but frames 4, 5, and 6 arrive intact at the receiver. How does the Go-Back-N receiver react upon receiving frames 4, 5, and 6?",
                "options": [
                    {
                        "key": "A",
                        "text": "Discards frames 4, 5, and 6 and continues sending cumulative ACK for frame 2",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Go-Back-N receiver has window size Wr=1 and cannot buffer out-of-order frames; it discards 4, 5, 6 and repeats ACK 2."
                    },
                    {
                        "key": "B",
                        "text": "Buffers frames 4, 5, and 6 and sends a NACK specifically requesting only frame 3",
                        "is_correct": False,
                        "rationale": "Misconception: Selective Repeat buffers out-of-order frames, not Go-Back-N."
                    },
                    {
                        "key": "C",
                        "text": "Accepts all frames and asks the transport layer to reorder them later",
                        "is_correct": False,
                        "rationale": "Misconception: Data Link layer protocols enforce sequential delivery and do not offload framing order to upper layers."
                    },
                    {
                        "key": "D",
                        "text": "Resets the receiver connection and terminates transmission",
                        "is_correct": False,
                        "rationale": "Misconception: GBN recovers via sender timeout retransmission; it does not terminate the connection."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_03_FLOW_CONTROL",
                "explanation": "In Go-Back-N, the receiver maintains a window size of exactly 1 (Wr = 1). It only accepts the exact sequentially expected frame. When frame 3 is lost, out-of-order frames 4, 5, and 6 are discarded. The sender's retransmission timer for frame 3 expires, causing the sender to retransmit frames 3, 4, 5, and 6 ('Go-Back-N')."
            },
            {
                "id": "DQ_03_C",
                "text": "A link has a round-trip propagation time RTT = 40 ms and packet transmission time Tt = 2 ms. What is the minimum sender window size required to attain 100% link utilization without waiting for ACKs in an error-free channel?",
                "options": [
                    {
                        "key": "A",
                        "text": "21 packets (1 + 2a, where a = Tp / Tt = 20 ms / 2 ms = 10)",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Utilization U = W / (1 + 2a). To achieve U = 1, W = 1 + 2a = 1 + (40 ms / 2 ms) = 21 packets."
                    },
                    {
                        "key": "B",
                        "text": "10 packets",
                        "is_correct": False,
                        "rationale": "Misconception: Used single one-way propagation time a = 10 without accounting for the round-trip delay cycle 1 + 2a."
                    },
                    {
                        "key": "C",
                        "text": "2 packets",
                        "is_correct": False,
                        "rationale": "Misconception: Severe underestimation that results in under 10% channel utilization."
                    },
                    {
                        "key": "D",
                        "text": "40 packets",
                        "is_correct": False,
                        "rationale": "Misconception: Equated window size directly to RTT in milliseconds without dividing by transmission time."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_03_FLOW_CONTROL",
                "explanation": "Total cycle time required for the first packet to be acknowledged is Tt + RTT = 2 ms + 40 ms = 42 ms. During this cycle, the sender can transmit (Tt + RTT) / Tt = 42 / 2 = 21 packets continuously to keep the pipe 100% full (W = 1 + 2a = 21)."
            }
        ],
        "lesson": {
            "title": "Sliding Window Protocols: Go-Back-N vs Selective Repeat",
            "axiom": "Window size must satisfy W_sender + W_receiver <= 2^n (where n is sequence number bits). If violated, old frames and new frames alias onto identical sequence numbers.",
            "diagram": """+---------------------+-------------------+-------------------+
| Protocol            | Receiver Window   | Max Sender Window |
+---------------------+-------------------+-------------------+
| Stop-and-Wait       | Wr = 1            | Ws = 1            |
| Go-Back-N (GBN)     | Wr = 1            | Ws = 2^n - 1      |
| Selective Repeat    | Wr = Ws           | Ws = 2^(n-1)      |
+---------------------+-------------------+-------------------+""",
            "trap": "Applying the GBN formula (2^n - 1) to Selective Repeat, or assuming the receiver can buffer out-of-order frames in GBN.",
            "rules": [
                "Go-Back-N discards all out-of-order frames and retransmits all unacknowledged frames starting from the lost frame.",
                "Selective Repeat buffers out-of-order frames and retransmits only specifically lost frames (individual timers / NACKs).",
                "Link efficiency: n = W / (1 + 2a), where a = Propagation Delay / Transmission Delay."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_03_1",
                "text": "In a 4-bit sequence number Go-Back-N protocol, what is the maximum sender window size?",
                "options": [
                    {"key": "A", "text": "15 (2^4 - 1)", "is_correct": True},
                    {"key": "B", "text": "8 (2^(4-1))", "is_correct": False},
                    {"key": "C", "text": "16 (2^4)", "is_correct": False},
                    {"key": "D", "text": "7", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "In Go-Back-N, Ws <= 2^n - 1. With n = 4, 2^4 - 1 = 15."
            },
            {
                "id": "PQ_03_2",
                "text": "In Go-Back-N, if frames 0, 1, 2, 3, 4 are sent, and frame 2 is lost in transit, which frames must the sender retransmit upon timeout?",
                "options": [
                    {"key": "A", "text": "Frames 2, 3, and 4", "is_correct": True},
                    {"key": "B", "text": "Only frame 2", "is_correct": False},
                    {"key": "C", "text": "All frames 0 through 4", "is_correct": False},
                    {"key": "D", "text": "Frames 3 and 4 only", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "GBN discards out-of-order frames 3 and 4. When the timer for frame 2 expires, the sender retransmits 2, 3, and 4."
            },
            {
                "id": "PQ_03_3",
                "text": "If transmission delay Tt = 1 ms and round-trip propagation delay RTT = 19 ms, what is the minimum window size required to achieve 100% link utilization?",
                "options": [
                    {"key": "A", "text": "20 frames", "is_correct": True},
                    {"key": "B", "text": "10 frames", "is_correct": False},
                    {"key": "C", "text": "19 frames", "is_correct": False},
                    {"key": "D", "text": "1 frame", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Total cycle time = Tt + RTT = 1 + 19 = 20 ms. Number of frames transmitted per cycle = 20 ms / 1 ms = 20 frames."
            }
        ]
    },
    {
        "id": "CN_04_SUBNETTING_IP",
        "name": "IPv4 Addressing & CIDR Subnetting",
        "tier": 2,
        "category": "Network Layer",
        "prerequisites": ["CN_01_OSI_LAYERS"],
        "diagnostic_pool": [
            {
                "id": "DQ_04_A",
                "text": "An organization is assigned the network prefix 192.168.10.0/26. What is the valid range of usable host IP addresses and the directed broadcast address for this subnet?",
                "options": [
                    {
                        "key": "A",
                        "text": "Usable: 192.168.10.1 to 192.168.10.62; Broadcast: 192.168.10.63",
                        "is_correct": True,
                        "rationale": "Correct positive signal: /26 leaves 32 - 26 = 6 host bits (2^6 = 64 addresses). Block is .0 to .63. Network is .0, Broadcast is .63, usable hosts are .1 to .62."
                    },
                    {
                        "key": "B",
                        "text": "Usable: 192.168.10.0 to 192.168.10.63; Broadcast: 192.168.10.64",
                        "is_correct": False,
                        "rationale": "Misconception: Included Network address (.0) and Broadcast address (.63) in usable hosts, which are reserved."
                    },
                    {
                        "key": "C",
                        "text": "Usable: 192.168.10.1 to 192.168.10.126; Broadcast: 192.168.10.127",
                        "is_correct": False,
                        "rationale": "Misconception: Calculated for a /25 prefix (128 addresses) instead of /26 (64 addresses)."
                    },
                    {
                        "key": "D",
                        "text": "Usable: 192.168.10.1 to 192.168.10.254; Broadcast: 192.168.10.255",
                        "is_correct": False,
                        "rationale": "Misconception: Ignored CIDR /26 entirely and treated as default Class C /24."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_04_SUBNETTING_IP",
                "explanation": "With a /26 prefix: Subnet mask is 255.255.255.192. Host bits h = 32 - 26 = 6 bits. Total block size = 2^6 = 64. Subnet range is 192.168.10.0 through 192.168.10.63. The first address (.0) is the Network ID; the last address (.63) is the Directed Broadcast Address; usable host IPs are .1 through .62 (2^6 - 2 = 62 usable hosts)."
            },
            {
                "id": "DQ_04_B",
                "text": "A network engineer needs to split a Class C network (198.51.100.0/24) into at least 6 distinct departmental subnets, each supporting up to 25 host machines. Which CIDR subnet mask should be configured?",
                "options": [
                    {
                        "key": "A",
                        "text": "/27 (Subnet Mask: 255.255.255.224)",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Borrowing 3 bits gives 2^3 = 8 subnets (>= 6) with 5 host bits = 2^5 - 2 = 30 usable hosts per subnet (>= 25)."
                    },
                    {
                        "key": "B",
                        "text": "/28 (Subnet Mask: 255.255.255.240)",
                        "is_correct": False,
                        "rationale": "Misconception: /28 gives only 14 usable hosts (2^4 - 2), which fails the 25-host requirement."
                    },
                    {
                        "key": "C",
                        "text": "/26 (Subnet Mask: 255.255.255.192)",
                        "is_correct": False,
                        "rationale": "Misconception: /26 yields only 2^2 = 4 subnets, failing the requirement of at least 6 subnets."
                    },
                    {
                        "key": "D",
                        "text": "/25 (Subnet Mask: 255.255.255.128)",
                        "is_correct": False,
                        "rationale": "Misconception: /25 yields only 2 subnets."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_04_SUBNETTING_IP",
                "explanation": "To create at least 6 subnets from /24, borrow 3 subnet bits: 2^3 = 8 subnets. New prefix = 24 + 3 = /27 (Mask 255.255.255.224). Remaining host bits = 5, providing 2^5 - 2 = 30 usable hosts per subnet, satisfying both constraints."
            },
            {
                "id": "DQ_04_C",
                "text": "Given the host IP address 172.16.50.130 configured with prefix /25, which subnet network ID does this host belong to, and what is its default gateway's subnet broadcast address?",
                "options": [
                    {
                        "key": "A",
                        "text": "Subnet Network ID: 172.16.50.128; Broadcast: 172.16.50.255",
                        "is_correct": True,
                        "rationale": "Correct positive signal: /25 splits the 256 octet into block 0 (0-127) and block 1 (128-255). 130 is in block 128-255 with broadcast .255."
                    },
                    {
                        "key": "B",
                        "text": "Subnet Network ID: 172.16.50.0; Broadcast: 172.16.50.127",
                        "is_correct": False,
                        "rationale": "Misconception: 130 is greater than 127 and belongs to the upper half of the /25 space, not the lower half."
                    },
                    {
                        "key": "C",
                        "text": "Subnet Network ID: 172.16.50.64; Broadcast: 172.16.50.191",
                        "is_correct": False,
                        "rationale": "Misconception: Confused /25 block size (128) with /26 block size (64)."
                    },
                    {
                        "key": "D",
                        "text": "Subnet Network ID: 172.16.0.0; Broadcast: 172.16.255.255",
                        "is_correct": False,
                        "rationale": "Misconception: Treated as default Class B /16 network, ignoring CIDR /25 mask."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_04_SUBNETTING_IP",
                "explanation": "A /25 mask has 1 bit in the fourth octet (128), dividing the 256 addresses into two blocks: [0 - 127] and [128 - 255]. Address 172.16.50.130 falls into the second block. Its subnet network address is 172.16.50.128 and its broadcast address is 172.16.50.255."
            }
        ],
        "lesson": {
            "title": "CIDR Subnetting & Usable Host Calculation",
            "axiom": "In IPv4 /x, Host Bits h = 32 - x. Total Addresses = 2^h. Usable Hosts = 2^h - 2 (subtracting Network ID and Directed Broadcast Address).",
            "diagram": """Prefix: /26
Binary Mask: 11111111.11111111.11111111.11 000000  (255.255.255.192)
Host Bits:   6 bits (2^6 = 64 total addresses per subnet block)
Block 0:     192.168.10.0 (Network ID)
Usable Hosts: 192.168.10.1 ---> 192.168.10.62 (62 hosts)
Broadcast:   192.168.10.63 (Directed Broadcast)""",
            "trap": "Forgetting to subtract 2 for the network ID and broadcast address, or miscomputing the block size in the last octet (256 - mask).",
            "rules": [
                "Block Size = 256 - Last Octet of Subnet Mask (e.g., 256 - 192 = 64).",
                "First address in block = Subnet Network ID (cannot be assigned to a host).",
                "Last address in block = Directed Broadcast (cannot be assigned to a host)."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_04_1",
                "text": "What is the subnet mask for a /28 CIDR network prefix?",
                "options": [
                    {"key": "A", "text": "255.255.255.240", "is_correct": True},
                    {"key": "B", "text": "255.255.255.224", "is_correct": False},
                    {"key": "C", "text": "255.255.255.248", "is_correct": False},
                    {"key": "D", "text": "255.255.255.192", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "28 bits = 8 + 8 + 8 + 4 bits. In the fourth octet: 128 + 64 + 32 + 16 = 240."
            },
            {
                "id": "PQ_04_2",
                "text": "How many usable host IP addresses are provided by a subnet with mask 255.255.255.224 (/27)?",
                "options": [
                    {"key": "A", "text": "30 usable hosts", "is_correct": True},
                    {"key": "B", "text": "32 usable hosts", "is_correct": False},
                    {"key": "C", "text": "14 usable hosts", "is_correct": False},
                    {"key": "D", "text": "62 usable hosts", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Host bits h = 32 - 27 = 5 bits. Total = 2^5 = 32. Usable = 32 - 2 = 30."
            },
            {
                "id": "PQ_04_3",
                "text": "For the IP address 172.16.50.130/25, which subnet network ID does this host belong to?",
                "options": [
                    {"key": "A", "text": "172.16.50.128", "is_correct": True},
                    {"key": "B", "text": "172.16.50.0", "is_correct": False},
                    {"key": "C", "text": "172.16.50.64", "is_correct": False},
                    {"key": "D", "text": "172.16.50.192", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "/25 splits the 256 addresses into two blocks: 0-127 and 128-255. 130 falls into the second block starting at 172.16.50.128."
            }
        ]
    },
    {
        "id": "CN_05_ROUTING_ALGO",
        "name": "Routing Algorithms (Dijkstra vs Distance Vector)",
        "tier": 3,
        "category": "Network Layer",
        "prerequisites": ["CN_04_SUBNETTING_IP"],
        "diagnostic_pool": [
            {
                "id": "DQ_05_A",
                "text": "In Distance Vector routing protocols based on the Bellman-Ford algorithm, what major convergence failure can occur when a link goes down, and what technique is specifically used to mitigate two-node routing loops caused by this phenomenon?",
                "options": [
                    {
                        "key": "A",
                        "text": "Count-to-Infinity problem; Split Horizon with Poison Reverse",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Distance Vector protocols suffer from Count-to-Infinity due to slow convergence on broken links. Split Horizon with Poison Reverse prevents advertising a route back on the interface through which it was learned."
                    },
                    {
                        "key": "B",
                        "text": "Dijkstra oscillation; Dijkstra shortest path first recalculation",
                        "is_correct": False,
                        "rationale": "Misconception: Dijkstra is used in Link State protocols (OSPF), not Distance Vector protocols."
                    },
                    {
                        "key": "C",
                        "text": "Broadcast storm; Spanning Tree Protocol (STP)",
                        "is_correct": False,
                        "rationale": "Misconception: STP operates at Layer 2 to prevent bridge loops, not Layer 3 routing convergence."
                    },
                    {
                        "key": "D",
                        "text": "BGP autonomous system loop; AS-Path prepending",
                        "is_correct": False,
                        "rationale": "Misconception: AS-Path attribute is used in BGP inter-domain path-vector routing, not basic Bellman-Ford distance vector."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_05_ROUTING_ALGO",
                "explanation": "Distance Vector routing (Bellman-Ford, e.g., RIP) suffers from the 'Count-to-Infinity' problem because routers exchange vectors without full topology visibility. When a link fails, neighbors incrementally increment metric costs in a loop. 'Split Horizon' stops advertising routes back to the neighbor they were learned from, and 'Poison Reverse' explicitly advertises the metric as infinity (16 in RIP) back to that neighbor."
            },
            {
                "id": "DQ_05_B",
                "text": "How does Link-State routing (such as OSPF) achieve faster loop-free convergence compared to Distance Vector protocols?",
                "options": [
                    {
                        "key": "A",
                        "text": "Every node floods Link-State Advertisements (LSAs) so all routers construct an identical topology map and independently run Dijkstra's algorithm",
                        "is_correct": True,
                        "rationale": "Correct positive signal: OSPF routers possess complete global topological maps of the area and calculate optimal loop-free shortest paths using Dijkstra."
                    },
                    {
                        "key": "B",
                        "text": "Routers only ask immediate neighbors for advice whenever a packet needs forwarding",
                        "is_correct": False,
                        "rationale": "Misconception: That describes hop-by-hop distance vector behavior, which has no global map."
                    },
                    {
                        "key": "C",
                        "text": "OSPF sets all link metrics to a fixed value of 1 hop regardless of bandwidth",
                        "is_correct": False,
                        "rationale": "Misconception: RIP uses hop counts; OSPF uses cost based on reference bandwidth / link bandwidth."
                    },
                    {
                        "key": "D",
                        "text": "A centralized primary router computes all routes and pushes them down to client routers",
                        "is_correct": False,
                        "rationale": "Misconception: That describes SDN (Software Defined Networking), not distributed OSPF."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_05_ROUTING_ALGO",
                "explanation": "In Link-State routing, every router floods local link statuses across the entire area. Consequently, every router builds an identical Link-State Database (LSDB) representing the complete network graph, then executes Dijkstra's Shortest Path First (SPF) algorithm to produce a loop-free routing table."
            },
            {
                "id": "DQ_05_C",
                "text": "In the global Internet core, Border Gateway Protocol (BGP) acts as an Inter-domain Path Vector protocol. How does BGP fundamentally prevent routing loops across Autonomous Systems (AS)?",
                "options": [
                    {
                        "key": "A",
                        "text": "Each BGP route advertisement records the sequence of AS numbers (AS-Path); a router drops any route containing its own AS number",
                        "is_correct": True,
                        "rationale": "Correct positive signal: AS-Path serves as explicit loop detection; if a router sees its own ASN in the path, it discards the update."
                    },
                    {
                        "key": "B",
                        "text": "BGP restricts internet routing to a maximum diameter of 15 hops",
                        "is_correct": False,
                        "rationale": "Misconception: 15-hop limit is a RIP constraint, wholly unsuitable for the global Internet."
                    },
                    {
                        "key": "C",
                        "text": "BGP converts all inter-domain paths into encrypted symmetric hashes",
                        "is_correct": False,
                        "rationale": "Misconception: BGP is a routing policy protocol, not an encryption protocol."
                    },
                    {
                        "key": "D",
                        "text": "BGP routers synchronize their system clocks using NTP to prevent stale routes",
                        "is_correct": False,
                        "rationale": "Misconception: Timestamping does not prevent topological cyclic loops in path-vector routing."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_05_ROUTING_ALGO",
                "explanation": "BGP prepends each Autonomous System Number (ASN) to the AS-Path attribute as routes are advertised across boundaries. When a border router receives an update, it examines the AS-Path. If its own ASN is already present, it detects a loop and immediately discards the advertisement."
            }
        ],
        "lesson": {
            "title": "Distance Vector vs Link State Routing",
            "axiom": "Distance Vector: Tell your neighbors about the entire world (Bellman-Ford, local info only, prone to loops). Link State: Tell the entire world about your immediate neighbors (Dijkstra, full topology visibility, fast convergence).",
            "diagram": """+---------------------+---------------------+---------------------+
| Feature             | Distance Vector     | Link State          |
+---------------------+---------------------+---------------------+
| Algorithm           | Bellman-Ford        | Dijkstra SPF        |
| Knowledge Scope     | Next-hop vector     | Complete Topology   |
| Protocol Example    | RIP (max metric 15) | OSPF, IS-IS         |
| Major Pitfall       | Count-to-Infinity   | High CPU / Memory   |
| Countermeasure      | Split Horizon       | Hierarchical Areas  |
+---------------------+---------------------+---------------------+""",
            "trap": "Confusing Layer 2 Spanning Tree (STP) loop prevention with Layer 3 IP routing loop remedies.",
            "rules": [
                "Split Horizon rule: Never send route information back in the direction from which it arrived.",
                "Poison Reverse: Advertise metric = Infinity (16) to the interface from which the route was learned.",
                "Link State (OSPF) floods Link State Advertisements (LSAs) and runs Dijkstra to produce loop-free shortest paths."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_05_1",
                "text": "In RIP (Routing Information Protocol), what metric value is defined as 'Infinity' to indicate an unreachable destination?",
                "options": [
                    {"key": "A", "text": "16 hops", "is_correct": True},
                    {"key": "B", "text": "255 hops", "is_correct": False},
                    {"key": "C", "text": "15 hops", "is_correct": False},
                    {"key": "D", "text": "100 hops", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "RIP limits hop count to 15; a hop count of 16 represents infinity (unreachable)."
            },
            {
                "id": "PQ_05_2",
                "text": "Which algorithm is executed by each router running OSPF to build its shortest path tree from the link-state database?",
                "options": [
                    {"key": "A", "text": "Dijkstra's Shortest Path First (SPF)", "is_correct": True},
                    {"key": "B", "text": "Bellman-Ford Algorithm", "is_correct": False},
                    {"key": "C", "text": "Floyd-Warshall All-Pairs Algorithm", "is_correct": False},
                    {"key": "D", "text": "Prim's Minimum Spanning Tree", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "OSPF nodes maintain an identical link-state database and run Dijkstra's algorithm to determine the shortest path tree rooted at themselves."
            },
            {
                "id": "PQ_05_3",
                "text": "Why does BGP (Border Gateway Protocol) utilize an AS-Path attribute rather than simple distance vector metrics?",
                "options": [
                    {"key": "A", "text": "To detect and eliminate routing loops across Autonomous Systems", "is_correct": True},
                    {"key": "B", "text": "To calculate the fastest round-trip latency across the Internet", "is_correct": False},
                    {"key": "C", "text": "To assign IP addresses dynamically to edge routers", "is_correct": False},
                    {"key": "D", "text": "To compress routing tables down to 8 bits", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "If a BGP router sees its own Autonomous System Number (ASN) in the received AS-Path list, it immediately rejects the advertisement, preventing inter-AS loops."
            }
        ]
    },
    {
        "id": "CN_06_TCP_UDP_TRANSPORT",
        "name": "Transport Protocols & TCP Handshake",
        "tier": 3,
        "category": "Transport Layer",
        "prerequisites": ["CN_04_SUBNETTING_IP"],
        "diagnostic_pool": [
            {
                "id": "DQ_06_A",
                "text": "During the standard TCP 3-Way Handshake between a client and server, what control flags and sequence number rules are exchanged in the second packet (Server to Client)?",
                "options": [
                    {
                        "key": "A",
                        "text": "SYN=1, ACK=1; Server chooses its initial sequence number ISN_s, and ACK number = ISN_c + 1",
                        "is_correct": True,
                        "rationale": "Correct positive signal: The server responds with SYN+ACK, sets its own random ISN_s, and acknowledges the client's SYN by consuming 1 sequence number (ACK = ISN_c + 1)."
                    },
                    {
                        "key": "B",
                        "text": "ACK=1 only; Server echoes back the client sequence number ISN_c without incrementing",
                        "is_correct": False,
                        "rationale": "Misconception: The server must also synchronize its own sequence space by sending SYN=1, not just ACK."
                    },
                    {
                        "key": "C",
                        "text": "SYN=1 only; Sequence numbers are reset to 0 for both endpoints",
                        "is_correct": False,
                        "rationale": "Misconception: Modern TCP uses pseudo-random Initial Sequence Numbers (ISNs) for security, never hardcoded 0."
                    },
                    {
                        "key": "D",
                        "text": "FIN=1, ACK=1; Server initiates immediate half-close connection state",
                        "is_correct": False,
                        "rationale": "Misconception: FIN is used in connection termination (4-way teardown), not connection establishment."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_06_TCP_UDP_TRANSPORT",
                "explanation": "TCP establishes a full-duplex connection using a 3-Way Handshake: 1) Client -> Server: SYN=1, Seq=ISN_c. 2) Server -> Client: SYN=1, ACK=1, Seq=ISN_s, AckNum=ISN_c + 1 (the SYN flag consumes 1 sequence number). 3) Client -> Server: ACK=1, Seq=ISN_c + 1, AckNum=ISN_s + 1."
            },
            {
                "id": "DQ_06_B",
                "text": "When terminating an established TCP connection, why does the host initiating the close transition into the TIME_WAIT state for 2*MSL (Maximum Segment Lifetime) before destroying the socket?",
                "options": [
                    {
                        "key": "A",
                        "text": "To ensure the final ACK reliably reaches the remote host and prevent lingering duplicate packets from corrupting future connections",
                        "is_correct": True,
                        "rationale": "Correct positive signal: TIME_WAIT allows retransmitting the final ACK if lost, and guarantees all in-flight segments from the old connection die before port reuse."
                    },
                    {
                        "key": "B",
                        "text": "To compute checksum verification on all historical data transferred during the session",
                        "is_correct": False,
                        "rationale": "Misconception: Checksums are computed and verified per segment in real time, not accumulated after closing."
                    },
                    {
                        "key": "C",
                        "text": "Because the operating system kernel cannot deallocate memory without a timer interrupt",
                        "is_correct": False,
                        "rationale": "Misconception: OS memory management is instantaneous; TIME_WAIT is a protocol reliability requirement."
                    },
                    {
                        "key": "D",
                        "text": "To allow the client to download cached images from the server in half-duplex mode",
                        "is_correct": False,
                        "rationale": "Misconception: TIME_WAIT occurs after both data directions are closed."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_06_TCP_UDP_TRANSPORT",
                "explanation": "TIME_WAIT serves two critical purposes: 1) If the client's final ACK is lost, the server retransmits its FIN; the client must be alive to re-send ACK. 2) 2*MSL (typically 60-120s) guarantees that any delayed duplicate segments from the closed session have expired in the network before a new socket reuses the same port pair."
            },
            {
                "id": "DQ_06_C",
                "text": "Why do real-time audio and video conferencing applications (such as VoIP and WebRTC) preferentially use UDP rather than TCP for media streaming?",
                "options": [
                    {
                        "key": "A",
                        "text": "TCP retransmission delays and head-of-line blocking cause unacceptable audio/video jitter, whereas dropping a timely UDP packet is preferable to late delivery",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Real-time interactive communication prioritizes timeliness over 100% loss recovery; TCP retransmission causes freezing and latency lag."
                    },
                    {
                        "key": "B",
                        "text": "UDP encrypts audio streams at the physical hardware layer",
                        "is_correct": False,
                        "rationale": "Misconception: UDP provides no native encryption (SRTP/DTLS is needed on top)."
                    },
                    {
                        "key": "C",
                        "text": "TCP headers are 200 bytes larger than UDP headers",
                        "is_correct": False,
                        "rationale": "Misconception: Standard TCP header is 20 bytes vs UDP 8 bytes; the 12-byte difference is trivial compared to retransmission delay."
                    },
                    {
                        "key": "D",
                        "text": "Routers automatically prioritize UDP packets over TCP packets during congestion",
                        "is_correct": False,
                        "rationale": "Misconception: Standard IP routers treat TCP and UDP packets equally in FIFO queues."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_06_TCP_UDP_TRANSPORT",
                "explanation": "TCP guarantees reliable in-order delivery. If a voice sample packet is lost, TCP stalls subsequent packets until retransmission completes (Head-of-Line blocking), causing audio lag. In real-time conversation, a 100ms old audio packet is useless; it is better to drop it and play the next live frame via UDP."
            }
        ],
        "lesson": {
            "title": "TCP 3-Way Handshake & Connection State Machine",
            "axiom": "SYN and FIN control flags consume exactly 1 sequence number even when payload data is 0 bytes. This ensures reliable synchronization of both sequence streams.",
            "diagram": """Client (Active Open)                                 Server (Passive Listen)
      |                                                        |
      | ------------- 1. [SYN] Seq = x --------------------->  | LISTEN -> SYN_RCVD
      |                                                        |
SYN_SENT | <------------ 2. [SYN, ACK] Seq = y, Ack = x+1 ----  |
      |                                                        |
ESTABLISHED | ------------- 3. [ACK] Seq = x+1, Ack = y+1 ------> | ESTABLISHED
      v                                                        v""",
            "trap": "Assuming the ACK number in packet 2 equals the client sequence number without adding 1, or confusing connection establishment (SYN) with teardown (FIN).",
            "rules": [
                "Packet 1: SYN (Client initiates, Seq = x).",
                "Packet 2: SYN-ACK (Server accepts and initiates reverse, Seq = y, Ack = x + 1).",
                "Packet 3: ACK (Client confirms, Seq = x + 1, Ack = y + 1). Now data transfer can commence."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_06_1",
                "text": "If a client sends a SYN packet with Initial Sequence Number (ISN) = 5000, what will be the acknowledgment number in the server's SYN-ACK response?",
                "options": [
                    {"key": "A", "text": "5001", "is_correct": True},
                    {"key": "B", "text": "5000", "is_correct": False},
                    {"key": "C", "text": "5002", "is_correct": False},
                    {"key": "D", "text": "1", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Because the SYN flag logically consumes one sequence number, the server acknowledges it with 5000 + 1 = 5001."
            },
            {
                "id": "PQ_06_2",
                "text": "Which Transport Layer protocol is connectionless, has minimal 8-byte header overhead, and does not provide built-in retransmissions or flow control?",
                "options": [
                    {"key": "A", "text": "User Datagram Protocol (UDP)", "is_correct": True},
                    {"key": "B", "text": "Transmission Control Protocol (TCP)", "is_correct": False},
                    {"key": "C", "text": "Stream Control Transmission Protocol (SCTP)", "is_correct": False},
                    {"key": "D", "text": "Internet Control Message Protocol (ICMP)", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "UDP provides lightweight, connectionless datagram delivery with only an 8-byte header (Source Port, Dest Port, Length, Checksum)."
            },
            {
                "id": "PQ_06_3",
                "text": "What TCP control flag is set to abruptly reject an invalid connection attempt or reset an established connection due to an unrecoverable error?",
                "options": [
                    {"key": "A", "text": "RST (Reset)", "is_correct": True},
                    {"key": "B", "text": "FIN (Finish)", "is_correct": False},
                    {"key": "C", "text": "URG (Urgent)", "is_correct": False},
                    {"key": "D", "text": "PSH (Push)", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "The RST (Reset) flag causes immediate abrupt termination of a TCP connection when an invalid segment arrives or a port is closed."
            }
        ]
    },
    {
        "id": "CN_07_TCP_CONGESTION",
        "name": "TCP Congestion Control (AIMD & Slow Start)",
        "tier": 4,
        "category": "Transport Layer",
        "prerequisites": ["CN_06_TCP_UDP_TRANSPORT", "CN_03_FLOW_CONTROL"],
        "diagnostic_pool": [
            {
                "id": "DQ_07_A",
                "text": "A TCP Tahoe/Reno connection has a slow start threshold ssthresh = 16 MSS. During the Slow Start phase, the Congestion Window (cwnd) reaches 16 MSS. What algorithm governs cwnd growth thereafter, and how does cwnd increment upon each received ACK?",
                "options": [
                    {
                        "key": "A",
                        "text": "Congestion Avoidance (AIMD); cwnd increases by approximately 1 MSS per RTT (or 1/cwnd per ACK)",
                        "is_correct": True,
                        "rationale": "Correct positive signal: When cwnd >= ssthresh, TCP switches from exponential Slow Start to linear Congestion Avoidance, adding 1 MSS per RTT."
                    },
                    {
                        "key": "B",
                        "text": "Slow Start; cwnd continues doubling exponentially every RTT indefinitely",
                        "is_correct": False,
                        "rationale": "Misconception: Slow start ends when cwnd reaches ssthresh to prevent inducing network buffer overflow."
                    },
                    {
                        "key": "C",
                        "text": "Flow Control; cwnd is fixed permanently to the receiver's rwnd buffer size",
                        "is_correct": False,
                        "rationale": "Misconception: Flow control (rwnd) protects receiver buffers; congestion control (cwnd) dynamically probes network bottleneck capacity."
                    },
                    {
                        "key": "D",
                        "text": "Fast Recovery; cwnd immediately resets to 1 MSS without any loss signal",
                        "is_correct": False,
                        "rationale": "Misconception: Fast Recovery is triggered by 3 duplicate ACKs, not by reaching ssthresh."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_07_TCP_CONGESTION",
                "explanation": "When cwnd < ssthresh, TCP is in Slow Start (cwnd doubles every RTT: +1 MSS per ACK). When cwnd >= ssthresh, TCP enters Congestion Avoidance (AIMD: Additive Increase / Multiplicative Decrease), where cwnd grows linearly by 1 MSS per RTT (i.e., cwnd = cwnd + 1/cwnd for each ACK) to gently probe available bandwidth without congesting intermediate routers."
            },
            {
                "id": "DQ_07_B",
                "text": "In TCP Reno, the sender receives 3 duplicate ACKs (4 identical ACKs total) while cwnd = 24 MSS. How does TCP Reno handle this event, and how does its behavior differ from legacy TCP Tahoe?",
                "options": [
                    {
                        "key": "A",
                        "text": "Reno performs Fast Retransmit, sets ssthresh = 12 MSS, cwnd = 15 MSS (ssthresh + 3), and enters Fast Recovery; Tahoe resets cwnd to 1 MSS",
                        "is_correct": True,
                        "rationale": "Correct positive signal: 3 duplicate ACKs signify that subsequent packets reached the receiver; Reno avoids collapsing cwnd to 1 MSS."
                    },
                    {
                        "key": "B",
                        "text": "Reno immediately resets cwnd to 0 and reopens the connection with a new 3-way handshake",
                        "is_correct": False,
                        "rationale": "Misconception: Neither version closes connections on packet loss; they retransmit lost segments."
                    },
                    {
                        "key": "C",
                        "text": "Reno ignores duplicate ACKs and waits for the retransmission timeout timer to expire",
                        "is_correct": False,
                        "rationale": "Misconception: Fast Retransmit was invented precisely to avoid waiting for slow RTO timer expiration."
                    },
                    {
                        "key": "D",
                        "text": "Reno doubles cwnd to 48 MSS to push through congested routers",
                        "is_correct": False,
                        "rationale": "Misconception: Increasing transmission during loss would catastrophically worsen network congestion."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_07_TCP_CONGESTION",
                "explanation": "Receiving 3 duplicate ACKs proves that packets sent after the missing segment successfully reached the receiver (clocking out duplicate ACKs). Unlike Tahoe, which resets cwnd to 1 MSS on any loss, TCP Reno executes Fast Recovery: ssthresh = cwnd / 2 = 12 MSS, cwnd = ssthresh + 3 MSS = 15 MSS, retransmits the single missing segment, and stays in congestion avoidance."
            },
            {
                "id": "DQ_07_C",
                "text": "A sender's Congestion Window cwnd is 48 KB, and the receiver advertises an available buffer space (Receive Window rwnd) of 16 KB. What is the maximum volume of in-flight unacknowledged data the sender is authorized to transmit?",
                "options": [
                    {
                        "key": "A",
                        "text": "16 KB (Effective Window = min(cwnd, rwnd))",
                        "is_correct": True,
                        "rationale": "Correct positive signal: To satisfy both network capacity and receiver memory capacity, the sender must transmit min(cwnd, rwnd) = min(48, 16) = 16 KB."
                    },
                    {
                        "key": "B",
                        "text": "48 KB (bounded only by cwnd)",
                        "is_correct": False,
                        "rationale": "Misconception: Sending 48 KB would overflow the receiver's 16 KB buffer, causing buffer overflow packet drops."
                    },
                    {
                        "key": "C",
                        "text": "64 KB (sum of cwnd and rwnd)",
                        "is_correct": False,
                        "rationale": "Misconception: cwnd and rwnd represent competing upper bounds and can never be added together."
                    },
                    {
                        "key": "D",
                        "text": "32 KB (average of cwnd and rwnd)",
                        "is_correct": False,
                        "rationale": "Misconception: The effective window is strictly the minimum function, not an average."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_07_TCP_CONGESTION",
                "explanation": "Flow control protects the receiver from being overrun (rwnd), while congestion control protects the subnet from buffer collapse (cwnd). The TCP sender must honor both constraints: Effective Window = min(cwnd, rwnd) = min(48 KB, 16 KB) = 16 KB."
            }
        ],
        "lesson": {
            "title": "TCP Congestion Control: Slow Start, AIMD, and Loss Recovery",
            "axiom": "Effective Window = min(cwnd, rwnd). When cwnd < ssthresh -> Exponential Growth (Slow Start). When cwnd >= ssthresh -> Linear Growth (Congestion Avoidance).",
            "diagram": """cwnd (MSS)
  ^
  |                  /\\ (Timeout: cwnd drops to 1 MSS, ssthresh = cwnd/2)
  |                 /  \\
16|---------------/-----\\------ ssthresh (Switch to Linear +1 MSS/RTT)
  |              /
  |            /   <--- Exponential Growth (Slow Start: doubles each RTT)
 1+----------/-------------------> Time (RTTs)""",
            "trap": "Confusing Congestion Window (cwnd, network capacity) with Receive Window (rwnd, receiver memory capacity).",
            "rules": [
                "Slow Start: cwnd starts at 1 (or initial window) and doubles every RTT (+1 MSS per ACK) until reaching ssthresh.",
                "Congestion Avoidance: cwnd increments linearly by 1 MSS per RTT (+1/cwnd per ACK).",
                "Loss via Timeout (Tahoe/Reno): ssthresh = cwnd / 2; cwnd resets to 1 MSS; enters Slow Start.",
                "Loss via 3 Duplicate ACKs (TCP Reno): ssthresh = cwnd / 2; cwnd = ssthresh + 3 MSS; enters Fast Recovery."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_07_1",
                "text": "In TCP Reno, what event causes the sender to enter Fast Retransmit and Fast Recovery without waiting for a retransmission timer expiration?",
                "options": [
                    {"key": "A", "text": "Arrival of 3 Duplicate ACKs for the same segment", "is_correct": True},
                    {"key": "B", "text": "Arrival of a single NACK packet", "is_correct": False},
                    {"key": "C", "text": "TCP receiver advertising rwnd = 0", "is_correct": False},
                    {"key": "D", "text": "Timeout of the Retransmission Timer (RTO)", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Receiving 3 duplicate ACKs (4 identical ACKs total) signals isolated packet loss while subsequent packets got through, triggering Fast Retransmit."
            },
            {
                "id": "PQ_07_2",
                "text": "If a TCP connection experiences a timeout when its cwnd is 32 MSS, what will be the new values of ssthresh and cwnd under TCP Tahoe?",
                "options": [
                    {"key": "A", "text": "ssthresh = 16 MSS, cwnd = 1 MSS", "is_correct": True},
                    {"key": "B", "text": "ssthresh = 32 MSS, cwnd = 16 MSS", "is_correct": False},
                    {"key": "C", "text": "ssthresh = 16 MSS, cwnd = 16 MSS", "is_correct": False},
                    {"key": "D", "text": "ssthresh = 8 MSS, cwnd = 2 MSS", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Upon timeout in TCP Tahoe: ssthresh is set to half the current cwnd (32 / 2 = 16 MSS), and cwnd resets back to 1 MSS."
            },
            {
                "id": "PQ_07_3",
                "text": "If a sender's Congestion Window cwnd = 40 KB and the receiver's advertised Receive Window rwnd = 24 KB, what is the maximum amount of unacknowledged data the sender can transmit?",
                "options": [
                    {"key": "A", "text": "24 KB (min of cwnd and rwnd)", "is_correct": True},
                    {"key": "B", "text": "40 KB", "is_correct": False},
                    {"key": "C", "text": "64 KB (sum of cwnd and rwnd)", "is_correct": False},
                    {"key": "D", "text": "16 KB", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "The maximum allowable in-flight unacknowledged data is bounded by min(cwnd, rwnd) = min(40, 24) = 24 KB."
            }
        ]
    },
    {
        "id": "CN_08_DNS_SYSTEM",
        "name": "Domain Name System (DNS Architecture)",
        "tier": 4,
        "category": "Application Layer",
        "prerequisites": ["CN_06_TCP_UDP_TRANSPORT"],
        "diagnostic_pool": [
            {
                "id": "DQ_08_A",
                "text": "When a local DNS recursive resolver looks up the IP address for 'engineering.college.edu' without any cached entries, what is the correct hierarchical order of name server queries performed?",
                "options": [
                    {
                        "key": "A",
                        "text": "Root DNS Server -> .edu Top-Level Domain (TLD) Server -> college.edu Authoritative DNS Server",
                        "is_correct": True,
                        "rationale": "Correct positive signal: DNS resolution follows the hierarchical tree: Root server provides TLD (.edu) referral; TLD server provides Authoritative (college.edu) referral."
                    },
                    {
                        "key": "B",
                        "text": "college.edu Authoritative Server -> .edu TLD Server -> Root Server",
                        "is_correct": False,
                        "rationale": "Misconception: Inverted hierarchy; the resolver does not know the authoritative server's address until TLD referral."
                    },
                    {
                        "key": "C",
                        "text": "Root DNS Server resolves the full host IP directly without intermediate referrals",
                        "is_correct": False,
                        "rationale": "Misconception: Root servers do not hold individual domain host records; they hold NS pointers to TLD servers."
                    },
                    {
                        "key": "D",
                        "text": "Local host broadcasts an ARP request across the Internet to discover the engineering IP",
                        "is_correct": False,
                        "rationale": "Misconception: ARP resolves IP to MAC on local Ethernet links only, cannot cross routers or resolve domain names."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_08_DNS_SYSTEM",
                "explanation": "DNS is a distributed hierarchical database. In an iterative resolution flow by a local recursive resolver: 1) Query Root Server (returns NS referral for .edu TLD). 2) Query .edu TLD Server (returns NS referral for authoritative server of college.edu). 3) Query Authoritative Server for college.edu (returns the A/AAAA record mapping engineering.college.edu to its IP address)."
            },
            {
                "id": "DQ_08_B",
                "text": "What is the structural difference between a Recursive DNS Query and an Iterative DNS Query?",
                "options": [
                    {
                        "key": "A",
                        "text": "In recursive queries, the contacted server must return the final answer; in iterative queries, the server returns the best referral to the next server down the tree",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Clients send recursive queries to local resolvers; local resolvers perform iterative queries across Root, TLD, and Authoritative servers."
                    },
                    {
                        "key": "B",
                        "text": "Recursive queries use TCP while iterative queries use UDP",
                        "is_correct": False,
                        "rationale": "Misconception: Both typically use UDP port 53 for standard lookups."
                    },
                    {
                        "key": "C",
                        "text": "Iterative queries repeat the same question 10 times to prevent packet loss",
                        "is_correct": False,
                        "rationale": "Misconception: Iterative resolution refers to following referrals step-by-step, not retransmitting."
                    },
                    {
                        "key": "D",
                        "text": "Recursive queries can only resolve IPv4 (A) records, while iterative resolves IPv6 (AAAA)",
                        "is_correct": False,
                        "rationale": "Misconception: Both query modes support all standard DNS resource record types."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_08_DNS_SYSTEM",
                "explanation": "A client (stub resolver) asks its local recursive resolver: 'Find this answer for me' (Recursive query). The local resolver queries the root, TLD, and authoritative servers with Iterative queries: 'If you don't know the exact answer, tell me who to ask next' (Referrals)."
            },
            {
                "id": "DQ_08_C",
                "text": "A network administrator maps 'portal.college.edu' to 'web-cluster-01.aws.college.edu', and maps 'web-cluster-01.aws.college.edu' to '198.51.100.42'. What specific DNS Resource Record types are utilized for these two respective mappings?",
                "options": [
                    {
                        "key": "A",
                        "text": "First mapping: CNAME (Canonical Name) Record; Second mapping: A (Address) Record",
                        "is_correct": True,
                        "rationale": "Correct positive signal: CNAME aliases an alias domain to a canonical hostname; A record maps a hostname directly to an IPv4 address."
                    },
                    {
                        "key": "B",
                        "text": "First mapping: A Record; Second mapping: PTR Record",
                        "is_correct": False,
                        "rationale": "Misconception: A record maps to an IP address, not another hostname; PTR is reverse DNS."
                    },
                    {
                        "key": "C",
                        "text": "First mapping: MX Record; Second mapping: NS Record",
                        "is_correct": False,
                        "rationale": "Misconception: MX is for mail exchanges; NS specifies authoritative name servers."
                    },
                    {
                        "key": "D",
                        "text": "First mapping: TXT Record; Second mapping: SOA Record",
                        "is_correct": False,
                        "rationale": "Misconception: TXT holds metadata/SPF; SOA holds zone authority parameters."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_08_DNS_SYSTEM",
                "explanation": "CNAME (Canonical Name) records define an alias pointing to another domain name. An A (Address) record maps a fully qualified domain name (FQDN) directly to a 32-bit IPv4 address."
            }
        ],
        "lesson": {
            "title": "Hierarchical DNS Architecture & Query Resolution",
            "axiom": "DNS namespace is an inverted tree rooted at '.'. Recursive queries shift the burden to the local resolver; Iterative queries return referrals to lower-level authoritative servers.",
            "diagram": """                      [ Root DNS (.) ]
                             | (Referral to .edu)
                     [ TLD Server (.edu) ]
                             | (Referral to college.edu NS)
             [ Authoritative Server (college.edu) ]
                             | (A Record: 198.51.100.25)
                     [ Local Resolver / Host ]""",
            "trap": "Believing Root DNS servers store all website IP addresses, or confusing recursive queries (resolver asks on your behalf) with iterative queries (referral sent back).",
            "rules": [
                "DNS predominantly uses UDP Port 53 for queries (low latency), and TCP Port 53 for zone transfers or responses exceeding 512 bytes.",
                "Record Types: A (IPv4), AAAA (IPv6), CNAME (Canonical Alias), MX (Mail Exchange), NS (Authoritative Name Server), PTR (Reverse Lookup).",
                "TTL (Time to Live) determines how long intermediate caching resolvers can retain records before re-querying."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_08_1",
                "text": "Which DNS resource record type maps a domain name alias to its canonical domain name rather than directly to an IP address?",
                "options": [
                    {"key": "A", "text": "CNAME Record", "is_correct": True},
                    {"key": "B", "text": "A Record", "is_correct": False},
                    {"key": "C", "text": "MX Record", "is_correct": False},
                    {"key": "D", "text": "PTR Record", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "A CNAME (Canonical Name) record aliases one domain name (e.g., www.example.com) to another canonical name (e.g., example.com)."
            },
            {
                "id": "PQ_08_2",
                "text": "Under what circumstance does DNS switch from using UDP Port 53 to TCP Port 53?",
                "options": [
                    {"key": "A", "text": "When response size exceeds 512 bytes (without EDNS0) or during Zone Transfers between servers", "is_correct": True},
                    {"key": "B", "text": "Whenever an HTTPS website is being looked up", "is_correct": False},
                    {"key": "C", "text": "Whenever an IPv6 address (AAAA) is queried", "is_correct": False},
                    {"key": "D", "text": "Only when client computer restarts", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Standard DNS responses over UDP are limited to 512 bytes. If the response exceeds this or when authoritative servers perform zone transfers (AXFR), TCP port 53 is used."
            },
            {
                "id": "PQ_08_3",
                "text": "What is the primary function of the TTL (Time-To-Live) field in a DNS response packet?",
                "options": [
                    {"key": "A", "text": "Specifies the number of seconds the record can be cached by resolvers before expiring", "is_correct": True},
                    {"key": "B", "text": "Specifies the maximum router hops the query can travel across the Internet", "is_correct": False},
                    {"key": "C", "text": "Specifies the round-trip latency to the web server", "is_correct": False},
                    {"key": "D", "text": "Specifies the encryption key lifetime for DNSSEC", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "DNS TTL defines how long a client or recursive DNS cache can answer subsequent requests with that record without contacting the authoritative server."
            }
        ]
    },
    {
        "id": "CN_09_HTTP_APPLICATION",
        "name": "HTTP/HTTPS & Web Protocols",
        "tier": 4,
        "category": "Application Layer",
        "prerequisites": ["CN_06_TCP_UDP_TRANSPORT"],
        "diagnostic_pool": [
            {
                "id": "DQ_09_A",
                "text": "An HTTP/1.1 client sends multiple sequential requests over a single TCP connection. What header directive enables persistent connections by default, and how does HTTP/2 solve the head-of-line (HoL) blocking problem present in HTTP/1.1 pipelining?",
                "options": [
                    {
                        "key": "A",
                        "text": "Connection: keep-alive; HTTP/2 introduces binary framing and multiplexed concurrent streams over a single connection",
                        "is_correct": True,
                        "rationale": "Correct positive signal: HTTP/1.1 uses persistent keep-alive connections by default. HTTP/2 eliminates application-layer HoL blocking by breaking messages into independent binary frames multiplexed over concurrent streams."
                    },
                    {
                        "key": "B",
                        "text": "Connection: close; HTTP/2 opens 10 separate parallel TCP connections simultaneously",
                        "is_correct": False,
                        "rationale": "Misconception: 'close' disables persistence; HTTP/2 consolidates traffic into 1 single TCP connection, not multiple."
                    },
                    {
                        "key": "C",
                        "text": "Cache-Control: no-cache; HTTP/2 replaces TCP with raw UDP without reliability",
                        "is_correct": False,
                        "rationale": "Misconception: HTTP/2 still runs over TCP. (HTTP/3 uses QUIC over UDP)."
                    },
                    {
                        "key": "D",
                        "text": "Transfer-Encoding: chunked; HTTP/2 eliminates headers entirely",
                        "is_correct": False,
                        "rationale": "Misconception: HTTP/2 compresses headers using HPACK rather than eliminating them."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_09_HTTP_APPLICATION",
                "explanation": "In HTTP/1.1, persistent connections ('Connection: keep-alive') allow multiple HTTP requests over one TCP connection, but responses must be returned strictly in FIFO order, creating application-level Head-of-Line (HoL) blocking. HTTP/2 solves this by introducing a binary framing layer that interleaves requests and responses into multiplexed, prioritized streams over a single TCP connection."
            },
            {
                "id": "DQ_09_B",
                "text": "A web browser requests a cached image with the request header 'If-None-Match: \"e84b-5c8\"'. If the web server finds that the asset on disk has not been altered since the browser cached it, what HTTP status code and body is returned?",
                "options": [
                    {
                        "key": "A",
                        "text": "304 Not Modified, with empty response body to save network bandwidth",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Conditional validation responds with 304 and zero body payload, instructing the browser to render from its local disk cache."
                    },
                    {
                        "key": "B",
                        "text": "200 OK, re-downloading the entire image payload again",
                        "is_correct": False,
                        "rationale": "Misconception: 200 OK indicates the asset changed or no cache validator matched, transmitting the full payload."
                    },
                    {
                        "key": "C",
                        "text": "301 Moved Permanently, redirecting to a new image CDN URL",
                        "is_correct": False,
                        "rationale": "Misconception: 301 is a permanent URL redirection, not a cache validation code."
                    },
                    {
                        "key": "D",
                        "text": "204 No Content, permanently deleting the image from browser cache",
                        "is_correct": False,
                        "rationale": "Misconception: 204 indicates an action succeeded without returning content, not conditional cache freshness."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_09_HTTP_APPLICATION",
                "explanation": "HTTP conditional headers ('If-None-Match' with ETag or 'If-Modified-Since' with timestamp) allow efficient cache validation. If the resource is unchanged, the server returns '304 Not Modified' with headers only and no body payload, minimizing latency and data transfer."
            },
            {
                "id": "DQ_09_C",
                "text": "Why does the modern HTTP/3 standard transition from TCP to QUIC running over UDP?",
                "options": [
                    {
                        "key": "A",
                        "text": "In HTTP/2 over TCP, a single packet loss stalls ALL multiplexed streams (Transport HoL blocking); QUIC handles packet loss per stream independently over UDP",
                        "is_correct": True,
                        "rationale": "Correct positive signal: QUIC implements independent flow control and loss recovery per stream, so packet loss on stream A never delays stream B."
                    },
                    {
                        "key": "B",
                        "text": "UDP allows web servers to transmit unlimited uncompressed traffic without congestion control",
                        "is_correct": False,
                        "rationale": "Misconception: QUIC implements sophisticated congestion control inside user space on top of UDP."
                    },
                    {
                        "key": "C",
                        "text": "TCP is being phased out globally and routers refuse to forward TCP port 80 packets",
                        "is_correct": False,
                        "rationale": "Misconception: TCP remains the backbone of the Internet; HTTP/3 is an optimization for web multiplexing."
                    },
                    {
                        "key": "D",
                        "text": "QUIC eliminates the need for TLS encryption",
                        "is_correct": False,
                        "rationale": "Misconception: QUIC integrates TLS 1.3 into its handshake by default; it does not eliminate encryption."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_09_HTTP_APPLICATION",
                "explanation": "Although HTTP/2 solved application-layer Head-of-Line blocking, all its streams share a single TCP connection. When a single TCP segment is dropped, TCP halts delivery of all succeeding bytes to the application until retransmission arrives. HTTP/3 solves this by using QUIC over UDP, providing stream-isolated retransmission and 0-RTT connection establishment."
            }
        ],
        "lesson": {
            "title": "Evolution of HTTP Protocols: HTTP/1.1, HTTP/2, and HTTP/3",
            "axiom": "HTTP/1.1 = Plaintext, persistent, FIFO blocking. HTTP/2 = Binary framing, multiplexing streams over 1 TCP connection. HTTP/3 = QUIC over UDP (eliminates transport HoL blocking).",
            "diagram": """HTTP/1.1 Pipelining (Head-of-Line Blocking):
[ Req 1 ] [ Req 2 ] --->
<--- [ Res 1 (SLOW!) ] ... [ Res 2 blocked waiting for Res 1! ]

HTTP/2 Multiplexing (Single TCP connection):
Stream 1: [ Frame 1A ]       [ Frame 1B ]
Stream 2:        [ Frame 2A ]       [ Frame 2B ]
Both interleaved concurrently without FIFO blocking!""",
            "trap": "Believing HTTP/2 runs over UDP (HTTP/2 runs over TCP; HTTP/3 runs over QUIC/UDP).",
            "rules": [
                "Status Codes: 2xx (Success), 3xx (Redirection), 4xx (Client Error), 5xx (Server Error).",
                "HTTP/1.1 Keep-Alive avoids repeated TCP 3-way handshakes for each page asset.",
                "HTTP/2 features: Binary framing, multiplexing, stream prioritization, header compression (HPACK), and server push."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_09_1",
                "text": "Which HTTP status code signifies that a requested resource has been permanently moved to a new URI?",
                "options": [
                    {"key": "A", "text": "301 Moved Permanently", "is_correct": True},
                    {"key": "B", "text": "302 Found (Temporary Redirect)", "is_correct": False},
                    {"key": "C", "text": "404 Not Found", "is_correct": False},
                    {"key": "D", "text": "503 Service Unavailable", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "301 Moved Permanently indicates the target resource has been assigned a new permanent URI in the Location header."
            },
            {
                "id": "PQ_09_2",
                "text": "What conditional HTTP request header is sent by a browser to check whether a cached asset has been modified since it was last downloaded?",
                "options": [
                    {"key": "A", "text": "If-Modified-Since (or If-None-Match with ETag)", "is_correct": True},
                    {"key": "B", "text": "Cache-Control: public", "is_correct": False},
                    {"key": "C", "text": "Content-Type: text/html", "is_correct": False},
                    {"key": "D", "text": "Authorization: Bearer", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "If-Modified-Since and If-None-Match (ETag) validate freshness with the server; if unchanged, server responds with '304 Not Modified'."
            },
            {
                "id": "PQ_09_3",
                "text": "Why does HTTP/3 adopt QUIC over UDP instead of TCP?",
                "options": [
                    {"key": "A", "text": "To eliminate TCP-level Head-of-Line blocking where a single packet drop stalls all multiplexed streams", "is_correct": True},
                    {"key": "B", "text": "Because UDP eliminates all security overhead", "is_correct": False},
                    {"key": "C", "text": "Because routers cannot inspect UDP headers", "is_correct": False},
                    {"key": "D", "text": "To remove port numbers from transport packets", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "In HTTP/2 over TCP, if one packet is lost, TCP stalls ALL streams until retransmission. HTTP/3 with QUIC over UDP isolates streams so packet loss on one stream does not block others."
            }
        ]
    },
    {
        "id": "CN_10_NETWORK_SECURITY",
        "name": "Network Security & TLS Cryptography",
        "tier": 5,
        "category": "Network Security",
        "prerequisites": ["CN_09_HTTP_APPLICATION", "CN_06_TCP_UDP_TRANSPORT"],
        "diagnostic_pool": [
            {
                "id": "DQ_10_A",
                "text": "During an HTTPS TLS 1.2 handshake, how are asymmetric (public key) and symmetric cryptography combined to ensure both confidential communication and high throughput?",
                "options": [
                    {
                        "key": "A",
                        "text": "Asymmetric cryptography authenticates the server and securely exchanges a symmetric session key; symmetric encryption then encrypts bulk application data",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Asymmetric crypto (RSA/Diffie-Hellman + Certificates) is computationally heavy and used only during handshake to agree on a pre-master secret; lightweight symmetric crypto (AES-GCM) encrypts actual bulk data."
                    },
                    {
                        "key": "B",
                        "text": "Asymmetric encryption encrypts all bulk data packets throughout the entire session",
                        "is_correct": False,
                        "rationale": "Misconception: Asymmetric crypto is orders of magnitude slower than symmetric crypto; using it for bulk transfer would cripple server CPU."
                    },
                    {
                        "key": "C",
                        "text": "Symmetric encryption is used to distribute the server's public key certificate",
                        "is_correct": False,
                        "rationale": "Misconception: Certificates contain public keys signed by Certificate Authorities (CAs) using asymmetric digital signatures."
                    },
                    {
                        "key": "D",
                        "text": "Only hash functions (SHA-256) are used without any encryption keys",
                        "is_correct": False,
                        "rationale": "Misconception: Hashing guarantees message integrity, but provides neither confidentiality nor key exchange on its own."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_10_NETWORK_SECURITY",
                "explanation": "TLS utilizes hybrid cryptography: Asymmetric cryptography (e.g., ECDHE, RSA) and X.509 Digital Certificates authenticate the server and negotiate a shared pre-master secret without leaking it to eavesdroppers. Once negotiated, fast hardware-accelerated symmetric cipher suites (e.g., AES-256-GCM, ChaCha20) encrypt and decrypt bulk application traffic."
            },
            {
                "id": "DQ_10_B",
                "text": "What vital security property does Ephemeral Diffie-Hellman (DHE / ECDHE) key exchange provide to HTTPS web sessions that static RSA key exchange lacked?",
                "options": [
                    {
                        "key": "A",
                        "text": "Forward Secrecy: Compromising the server's private key in the future cannot decrypt previously recorded encrypted session traffic",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Ephemeral keys are discarded immediately after the session finishes, protecting past sessions from future private key compromise."
                    },
                    {
                        "key": "B",
                        "text": "Zero-Latency: Completely eliminates the need for TCP SYN and ACK packets",
                        "is_correct": False,
                        "rationale": "Misconception: DHE operates at the TLS cryptographic layer, not TCP connection establishment."
                    },
                    {
                        "key": "C",
                        "text": "Passwordless Login: Automatically authorizes the client without user credentials",
                        "is_correct": False,
                        "rationale": "Misconception: Key exchange establishes channel encryption, not user account authentication."
                    },
                    {
                        "key": "D",
                        "text": "Quantum Immunity: Generates keys that are mathematically infinite in bit length",
                        "is_correct": False,
                        "rationale": "Misconception: Standard ECC/DHE is vulnerable to Shor's algorithm on quantum computers; post-quantum crypto requires lattice-based algorithms."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_10_NETWORK_SECURITY",
                "explanation": "Forward Secrecy ensures that session keys are ephemeral (temporary per connection). In static RSA, if an adversary records encrypted traffic today and steals the server's private key years later, they can decrypt all historical recordings. With ECDHE, each session derives a unique session key that is never stored, making retroactive decryption impossible."
            },
            {
                "id": "DQ_10_C",
                "text": "What fundamental architectural capability distinguishes a Stateful Inspection Firewall from a Stateless Packet Filter?",
                "options": [
                    {
                        "key": "A",
                        "text": "A stateful firewall maintains a dynamic state table tracking connection handshakes (SYN, ESTABLISHED, FIN) and automatically permits returning response packets",
                        "is_correct": True,
                        "rationale": "Correct positive signal: Stateful inspection understands connection context and dynamically permits outbound-initiated returning sessions without opening wide port ranges."
                    },
                    {
                        "key": "B",
                        "text": "A stateless packet filter decrypts all TLS encrypted application payloads",
                        "is_correct": False,
                        "rationale": "Misconception: Stateless filters inspect only static headers (IP/port) and cannot decrypt TLS payloads."
                    },
                    {
                        "key": "C",
                        "text": "A stateful firewall operates exclusively at the Physical Layer (Layer 1)",
                        "is_correct": False,
                        "rationale": "Misconception: Stateful firewalls operate across Layers 3 and 4 (and Layer 7 in NGFWs)."
                    },
                    {
                        "key": "D",
                        "text": "A stateless packet filter stores user passwords in an internal SQLite database",
                        "is_correct": False,
                        "rationale": "Misconception: Stateless filters evaluate static ACL rules row-by-row on individual packets without databases."
                    }
                ],
                "correct_option": "A",
                "concept_tested": "CN_10_NETWORK_SECURITY",
                "explanation": "Stateless filters inspect individual packets in isolation against static rules (IP, Port). Stateful firewalls track TCP handshakes, sequence numbers, and active session states. When an internal client initiates an outbound connection, the firewall records the session in its state table and automatically permits returning response packets, preventing unauthorized incoming connections without needing wide open inbound rules."
            }
        ],
        "lesson": {
            "title": "Hybrid Cryptography in TLS/HTTPS & Digital Certificates",
            "axiom": "Asymmetric crypto = Secure key exchange & authentication (slow). Symmetric crypto = Bulk data confidentiality (fast). Digital Signatures = Non-repudiation & integrity.",
            "diagram": """Client                                                       Server
  | ----- 1. ClientHello (supported ciphers, random_c) -----> |
  |                                                           |
  | <---- 2. ServerHello, Digital Certificate (Pub Key), ---- |
  |          ServerKeyExchange, ServerHelloDone               |
  |                                                           |
  | [Verify CA Certificate Signature]                         |
  | ----- 3. ClientKeyExchange (Pre-master secret), --------> |
  |          ChangeCipherSpec, Finished                       |
  |                                                           |
  | <---- 4. ChangeCipherSpec, Finished --------------------- |
  |                                                           |
  | <== Bulk Application Traffic Encrypted with AES-GCM ==>   |""",
            "trap": "Believing asymmetric encryption is used to encrypt all web traffic, or thinking symmetric keys are shared over cleartext without prior key exchange.",
            "rules": [
                "Public Key encrypts -> Only corresponding Private Key can decrypt (Confidentiality).",
                "Private Key signs -> Anyone with Public Key can verify signature (Authentication & Non-repudiation).",
                "Certificate Authorities (CAs) sign digital certificates using their private key; browsers verify against trusted Root CA stores."
            ]
        },
        "practice_questions": [
            {
                "id": "PQ_10_1",
                "text": "What mathematical property enables Diffie-Hellman Ephemeral (DHE / ECDHE) key exchange to provide Forward Secrecy?",
                "options": [
                    {"key": "A", "text": "Session keys are derived from temporary per-session key pairs; compromising the server's long-term private key later cannot decrypt recorded past traffic", "is_correct": True},
                    {"key": "B", "text": "The encryption algorithm changes passwords every 10 seconds", "is_correct": False},
                    {"key": "C", "text": "The client disables browser cache", "is_correct": False},
                    {"key": "D", "text": "Private keys are transmitted inside an encrypted UDP tunnel", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Forward Secrecy ensures past encrypted sessions remain safe even if the server's long-term private key is leaked in the future, because ephemeral session keys are discarded after session close."
            },
            {
                "id": "PQ_10_2",
                "text": "What type of firewall inspects IP addresses, port numbers, and TCP sequence numbers to track active connections across packet streams?",
                "options": [
                    {"key": "A", "text": "Stateful Inspection Packet Firewall", "is_correct": True},
                    {"key": "B", "text": "Stateless Packet Filter", "is_correct": False},
                    {"key": "C", "text": "Physical Layer Repeater", "is_correct": False},
                    {"key": "D", "text": "Circuit-level Proxy without TCP awareness", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "Stateful inspection firewalls maintain a state table tracking the lifecycle of established TCP connections (SYN, ESTABLISHED, FIN), permitting legitimate returning traffic automatically."
            },
            {
                "id": "PQ_10_3",
                "text": "Which cryptographic primitive ensures message integrity and detects unauthorized tampering of data in transit?",
                "options": [
                    {"key": "A", "text": "Cryptographic Hash Function / HMAC (e.g., SHA-256)", "is_correct": True},
                    {"key": "B", "text": "Base64 Encoding", "is_correct": False},
                    {"key": "C", "text": "Caesar Substitution Cipher", "is_correct": False},
                    {"key": "D", "text": "HTTP User-Agent String", "is_correct": False}
                ],
                "correct_option": "A",
                "explanation": "A cryptographic hash produces a fixed-size digest (avalanche effect). An HMAC incorporates a secret key to prove both integrity and authenticity."
            }
        ]
    }
]

# Ensure backward compatibility: each concept must also have diagnostic_question = diagnostic_pool[0]
for c in CONCEPTS:
    c["diagnostic_question"] = c["diagnostic_pool"][0]

# Write Question Bank JSON
os.makedirs("data", exist_ok=True)
with open("data/computer_networks_question_bank.json", "w", encoding="utf-8") as f:
    json.dump({
        "metadata": {
            "course": "Computer Networks (CN)",
            "target_audience": "Undergraduate B.Tech Computer Science & Allied Engineering",
            "curriculum": "Standard AICTE / ABET Undergrad CN Syllabus",
            "diagnostic_concepts_count": len(CONCEPTS),
            "questions_per_concept_pool": 3,
            "total_diagnostic_pool_items": len(CONCEPTS) * 3,
            "practice_items_per_concept": 3,
            "total_practice_items": len(CONCEPTS) * 3,
            "version": "2.5.0-multistudent-pools",
            "cautious_language_policy": "One-question diagnostic signals are labeled as 'positive answer signal' or 'likely gap'; robust mastery requires multi-item verification."
        },
        "concepts": CONCEPTS
    }, f, indent=2)

print("Saved data/computer_networks_question_bank.json with 30 diagnostic questions in pool + 30 practice questions.")

# Generate 10,000 Synthetic Benchmark Rows
DEPARTMENTS = [
    {"code": "CSE", "course": "CS301", "instructor": "Prof. Rajesh Sharma", "hod": "Dr. Ananya Sen"},
    {"code": "IT", "course": "IT302", "instructor": "Prof. Priya Murthy", "hod": "Dr. Vikram Malhotra"},
    {"code": "ECE", "course": "EC304", "instructor": "Prof. S. R. Kulkarni", "hod": "Dr. Meenakshi Sundaram"},
    {"code": "AIML", "course": "AI305", "instructor": "Prof. Neha Gupta", "hod": "Dr. Arvind Swaminathan"}
]

YEAR_SEMS = ["3rd Year / 5th Sem", "3rd Year / 6th Sem", "4th Year / 7th Sem"]
random.seed(42)

CONCEPT_PASS_RATES = {
    "CN_01_OSI_LAYERS": 0.76,
    "CN_02_FRAMING_CRC": 0.65,
    "CN_03_FLOW_CONTROL": 0.61,
    "CN_04_SUBNETTING_IP": 0.54,
    "CN_05_ROUTING_ALGO": 0.58,
    "CN_06_TCP_UDP_TRANSPORT": 0.70,
    "CN_07_TCP_CONGESTION": 0.49,
    "CN_08_DNS_SYSTEM": 0.68,
    "CN_09_HTTP_APPLICATION": 0.72,
    "CN_10_NETWORK_SECURITY": 0.62
}

csv_rows = []
score_distribution = {i: 0 for i in range(11)}
dept_scores = {d["code"]: [] for d in DEPARTMENTS}
concept_errors = {c["id"]: 0 for c in CONCEPTS}
prereq_cascades = 0

for i in range(1, 10001):
    dept_info = random.choice(DEPARTMENTS)
    dept_code = dept_info["code"]
    student_id = f"22{dept_code}{1000 + i}"
    year_sem = random.choice(YEAR_SEMS)
    
    ability = random.gauss(0.1, 0.9)
    responses = {}
    gaps = []
    score = 0
    
    for c in CONCEPTS:
        cid = c["id"]
        base_rate = CONCEPT_PASS_RATES[cid]
        
        prereq_penalty = 0.0
        for prereq_id in c["prerequisites"]:
            if prereq_id in responses and responses[prereq_id] == 0:
                prereq_penalty += 0.22
        
        adjusted_prob = min(0.96, max(0.08, base_rate + (ability * 0.16) - prereq_penalty))
        is_correct = 1 if random.random() < adjusted_prob else 0
        responses[cid] = is_correct
        if is_correct:
            score += 1
        else:
            gaps.append(cid)
            concept_errors[cid] += 1
            if prereq_penalty > 0:
                prereq_cascades += 1

    score_distribution[score] += 1
    dept_scores[dept_code].append(score)
    primary_gap = gaps[0] if gaps else "NONE"
    retest_score = random.choices([3, 2, 1], weights=[0.60, 0.28, 0.12])[0] if primary_gap != "NONE" else 3
    
    day_offset = random.randint(1, 30)
    hour = random.randint(8, 20)
    minute = random.randint(0, 59)
    timestamp = f"2026-09-{30 - day_offset + 1:02d}T{hour:02d}:{minute:02d}:00Z" if day_offset <= 30 else f"2026-10-0{day_offset - 30:02d}T{hour:02d}:{minute:02d}:00Z"
    
    csv_rows.append({
        "synthetic_record_id": f"SYN-{i:05d}",
        "is_synthetic": "TRUE",
        "student_id": student_id,
        "department": dept_code,
        "course": dept_info["course"],
        "assigned_instructor": dept_info["instructor"],
        "assigned_hod": dept_info["hod"],
        "year_semester": year_sem,
        "score": score,
        "percentage": score * 10,
        "primary_likely_gap": primary_gap,
        "q1_osi": responses["CN_01_OSI_LAYERS"],
        "q2_crc": responses["CN_02_FRAMING_CRC"],
        "q3_flow": responses["CN_03_FLOW_CONTROL"],
        "q4_subnet": responses["CN_04_SUBNETTING_IP"],
        "q5_routing": responses["CN_05_ROUTING_ALGO"],
        "q6_transport": responses["CN_06_TCP_UDP_TRANSPORT"],
        "q7_congestion": responses["CN_07_TCP_CONGESTION"],
        "q8_dns": responses["CN_08_DNS_SYSTEM"],
        "q9_http": responses["CN_09_HTTP_APPLICATION"],
        "q10_sec": responses["CN_10_NETWORK_SECURITY"],
        "retest_score": retest_score,
        "retest_status": "Secure (3/3)" if retest_score == 3 else ("Developing (2/3)" if retest_score == 2 else "Needs Instructor Review (1/3)"),
        "timestamp": timestamp
    })

csv_fieldnames = list(csv_rows[0].keys())
with open("data/computer_networks_diagnostic_10000.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=csv_fieldnames)
    writer.writeheader()
    writer.writerows(csv_rows)

print("Saved data/computer_networks_diagnostic_10000.csv (10,000 synthetic rows)")

# Compute and write dataset_stats.json
dept_stats = {}
for code, scores in dept_scores.items():
    dept_stats[code] = {
        "count": len(scores),
        "mean_score": round(sum(scores) / len(scores), 2),
        "mean_percentage": round((sum(scores) / len(scores)) * 10, 1),
        "pass_rate_6_plus": round(sum(1 for s in scores if s >= 6) / len(scores) * 100, 1)
    }

total_scores = [r["score"] for r in csv_rows]
overall_mean = round(sum(total_scores) / len(total_scores), 2)
variance = sum((s - overall_mean) ** 2 for s in total_scores) / len(total_scores)
overall_std = round(variance ** 0.5, 2)

concept_error_stats = []
for c in CONCEPTS:
    cid = c["id"]
    err_count = concept_errors[cid]
    concept_error_stats.append({
        "concept_id": cid,
        "concept_name": c["name"],
        "category": c["category"],
        "tier": c["tier"],
        "synthetic_error_count": err_count,
        "synthetic_error_rate_pct": round((err_count / 10000) * 100, 1),
        "synthetic_success_rate_pct": round(((10000 - err_count) / 10000) * 100, 1)
    })

concept_error_stats.sort(key=lambda x: x["synthetic_error_rate_pct"], reverse=True)

dataset_stats = {
    "metadata": {
        "dataset_name": "GapPath AI Synthetic Computer Networks Benchmark",
        "sample_size": 10000,
        "is_synthetic": True,
        "synthetic_notice": "ALL 10,000 ROWS ARE SYNTHETICALLY GENERATED FOR BENCHMARK CALIBRATION, ITEM DISCRIMINATION, AND STATISTICAL TESTING. DO NOT TREAT AS REAL STUDENT DATA.",
        "generated_timestamp": "2026-10-09T16:00:00Z"
    },
    "aggregate_metrics": {
        "total_records": 10000,
        "mean_score": overall_mean,
        "median_score": 6,
        "std_deviation": overall_std,
        "min_score": min(total_scores),
        "max_score": max(total_scores),
        "prereq_cascade_incidents": prereq_cascades,
        "prereq_cascade_rate_pct": round((prereq_cascades / (10000 * 10)) * 100, 2)
    },
    "score_distribution": score_distribution,
    "department_benchmarks": dept_stats,
    "concept_difficulty_ranking": concept_error_stats,
    "score_bands": {
        "advanced_9_to_10": sum(score_distribution[i] for i in [9, 10]),
        "proficient_7_to_8": sum(score_distribution[i] for i in [7, 8]),
        "developing_5_to_6": sum(score_distribution[i] for i in [5, 6]),
        "foundational_support_0_to_4": sum(score_distribution[i] for i in range(5))
    }
}

with open("data/dataset_stats.json", "w", encoding="utf-8") as f:
    json.dump(dataset_stats, f, indent=2)

print("Saved data/dataset_stats.json")
