import type React from "react";
import { useEffect, useMemo, useState } from "react";
import edgesRaw from "./phantom-forest-edges.json";

type Edge = {
  from: string;
  portal: string;
  to: string;
  requiresMap?: boolean;
  requiresMobility?: boolean;
};

const edges: Edge[] = edgesRaw as Edge[];

function buildEdgeList(hasMap: boolean, hasMobility: boolean): Edge[] {
  return edges.filter((e) => {
    if (!hasMap && e.requiresMap) return false;
    if (!hasMobility && e.requiresMobility) return false;
    return true;
  });
}

function buildGraph(activeEdges: Edge[]): Map<string, Edge[]> {
  const adj = new Map<string, Edge[]>();
  for (const e of activeEdges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e);
  }
  return adj;
}

type Step = { from: string; portal: string; to: string };

function findShortestPath(
  start: string,
  end: string,
  hasMap: boolean,
  hasMobility: boolean
): Step[] | null {
  if (start === end) return [];

  const activeEdges = buildEdgeList(hasMap, hasMobility);
  const graph = buildGraph(activeEdges);

  const queue: string[] = [];
  const visited = new Set<string>();
  const parent = new Map<string, { prev: string; edge: Edge }>();

  queue.push(start);
  visited.add(start);

  while (queue.length) {
    const node = queue.shift()!;
    const neighbors = graph.get(node) || [];

    for (const edge of neighbors) {
      const next = edge.to;
      if (visited.has(next)) continue;

      visited.add(next);
      parent.set(next, { prev: node, edge });

      if (next === end) {
        const steps: Step[] = [];
        let cur = end;
        while (cur !== start) {
          const info = parent.get(cur)!;
          steps.push({
            from: info.prev,
            portal: info.edge.portal,
            to: cur,
          });
          cur = info.prev;
        }
        steps.reverse();
        return steps;
      }
      queue.push(next);
    }
  }
  return null;
}

// Icons
const MAP_ICON =
  "https://maplelegends.com/static/images/lib/item/03992040.png";

const MOBILITY_SKILL_ICONS = [
  {
    name: "Teleport",
    src: "https://maplelegends.com/static/images/lib/skill/2101002.png",
  },
  {
    name: "Flash Jump",
    src: "https://maplelegends.com/static/images/lib/skill/4111006.png",
  },
  {
    name: "Assaulter",
    src: "https://maplelegends.com/static/images/lib/skill/4211002.png",
  },
  {
    name: "Corkscrew Blow",
    src: "https://maplelegends.com/static/images/lib/skill/5101004.png",
  },
  {
    name: "Recoil Shot",
    src: "https://maplelegends.com/static/images/lib/skill/5201006.png",
  },
];

const MOB_KNOCK_ICON =
  "https://maplelegends.com/static/images/lib/monster/3230101.png";

const MAP_GRAPHIC = "https://i.imgur.com/s7L7WZk.png";

const TOE_ICON =
  "https://maplelegends.com/static/images/lib/item/04032013.png";
const HORSEMAN_ICON =
  "https://maplelegends.com/static/images/lib/item/04031903.png";

function App() {
  const [start, setStart] = useState("Haunted House");
  const [end, setEnd] = useState("Bent Tree");
  const [hasMap, setHasMap] = useState(true);
  const [hasMobility, setHasMobility] = useState(true);
  const [result, setResult] = useState<Step[] | null>(null);
  const [showKnockTip, setShowKnockTip] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const maps = useMemo(() => {
    const s = new Set<string>();
    for (const e of edges) {
      s.add(e.from);
      s.add(e.to);
    }
    return Array.from(s).sort();
  }, []);

  useEffect(() => {
    const path = findShortestPath(start, end, hasMap, hasMobility);
    setResult(path);
  }, [start, end, hasMap, hasMobility]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // treat <640px as "mobile"
    };

    handleResize(); // set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const handleReverse = () => {
    const prevStart = start;
    const prevEnd = end;
    setStart(prevEnd);
    setEnd(prevStart);
  };

  const handleQuickRoute = (from: string, to: string) => {
    setStart(from);
    setEnd(to);
  };

  const renderResult = () => {
    if (result === null) {
      return (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#2b1b1b",
            borderRadius: 8,
            color: "#ffb3b3",
            border: "1px solid #ff4d4d",
            fontSize: "0.9rem",
            marginTop: "1rem",
          }}
        >
          No path found between these maps.
        </div>
      );
    }

    const steps = result;

    if (steps.length === 0) {
      return (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#111822",
            borderRadius: 8,
            color: "#e0e0e0",
            border: "1px solid #333",
            fontSize: "0.9rem",
            marginTop: "1rem",
          }}
        >
          You are already at the destination.
        </div>
      );
    }

    const items: React.ReactNode[] = [];

    items.push(
      <div
        key="map-start"
        style={{
          fontWeight: 700,
          color: "#ffd966",
          whiteSpace: "normal",
          textAlign: "center",
        }}
      >
        {start}
      </div>
    );

    steps.forEach((step, idx) => {
      const keyBase = `step-${idx}`;

      /* vertical line */
      items.push(
        <div
          key={`${keyBase}-line`}
          style={{
            width: 2,
            height: 22,
            background: "#777",
            margin: "0 auto",
          }}
        />
      );

      /* portal pill */
      items.push(
        <div
          key={`${keyBase}-portal`}
          style={{
            padding: "2px 10px",
            borderRadius: 999,
            background: "#5a4528",
            border: "1px solid #8b6a3d",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            margin: "0 auto",
            display: "inline-block",
          }}
        >
          {step.portal}
        </div>
      );

      /* down arrow (SVG) */
      items.push(
        <div
          key={`${keyBase}-arrow`}
          style={{
            margin: "0 auto",
            padding: 0,
          }}
        >
          <svg width="12" height="24" viewBox="0 0 12 34">
            <line x1="6" y1="0" x2="6" y2="26" stroke="#bbb" strokeWidth="2" />
            <polygon points="6,34 0,26 12,26" fill="#bbb" />
          </svg>
        </div>
      );

      items.push(
        <div
          key={`${keyBase}-map`}
          style={{
            fontWeight: 700,
            color: "#ffd966",
            whiteSpace: "normal",
            textAlign: "center",
          }}
        >
          {step.to}
        </div>
      );
    });

    return (
      <div
        style={{
          marginTop: "1rem",
          borderRadius: 8,
          border: "1px solid #333",
          background: "rgba(16,16,24,0.95)",
          padding: "0.85rem 1rem",
          fontSize: "0.9rem",
        }}
      >
        <div style={{ marginBottom: "0.4rem", opacity: 0.8 }}>Route:</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.1rem",
          }}
        >
          {items}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#050509",
          color: "#eee",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 1.5rem 0.5rem",
          }}
        >
          {/* Full-width header */}
          <h1 style={{ marginBottom: "1rem", textAlign: "center" }}>
            Sparrow's Phantom Forest Navigator
          </h1>

          <p style={{ margin: "0 0 0.75rem 0", opacity: 0.85, textAlign: "center" }}>
            A fan-made tool to help navigate the confusing portals and paths in Phantom Forest. Supports map-locked routes and mobility skill shortcuts. Inspired by maps created by Stereo and Gillies.
          </p>

          <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", opacity: 0.7, textAlign: "center" }}>
            Created by: <strong>thsscapi (Sparrow)</strong>
          </p>


          <div
            style={{
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {/* LEFT COLUMN: checkboxes + dropdowns + route */}
            <div
              style={{
                flex: "1 1 240px",
                minWidth: 320,
              }}
            >
              {/* Checkboxes + skills */}
              <div
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.8rem",
                  textAlign: "left",
                }}
              >
              <div style={{ marginBottom: "0.25rem" }}>Do you have:</div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasMap}
                    onChange={(e) => setHasMap(e.target.checked)}
                  />
                  <img
                    src={MAP_ICON}
                    alt="Map of Phantom Forest"
                    style={{
                      height: 32,
                      imageRendering: "pixelated",
                    }}
                  />
                  <span>Map of Phantom Forest</span>
                  <span style={{ fontSize: "0.75rem" }}>
                    {" "}
                    (
                    <a
                      href="https://forum.maplelegends.com/index.php?threads/guide-crimsonwood-keep-cwk-pre-quests.54671/"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "underline",
                        color: "#9ad1ff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <i>How to obtain</i>
                    </a>
                    )
                  </span>
                </label>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: "0.2rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasMobility}
                      onChange={(e) => setHasMobility(e.target.checked)}
                    />
                    <span>Mobility skill, E.g.:</span>
                  </div>

                  <div
                    style={{
                      marginTop: "0.3rem",
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "0.35rem",
                      textAlign: "center",
                    }}
                  >
                    {MOBILITY_SKILL_ICONS.map((skill) => (
                      <div key={skill.name}>
                        <img
                          src={skill.src}
                          alt={skill.name}
                          style={{
                            height: 40,
                            display: "block",
                            margin: "0 auto",
                            imageRendering: "pixelated",
                          }}
                        />
                        <span style={{ fontSize: "0.7rem" }}>
                          {skill.name}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setShowKnockTip(true)}
                      onMouseLeave={() => setShowKnockTip(false)}
                    >
                      <img
                        src={MOB_KNOCK_ICON}
                        alt="Mob knock-up"
                        style={{
                          height: 40,
                          display: "block",
                          margin: "0 auto",
                          imageRendering: "pixelated",
                        }}
                      />

                      <span style={{ fontSize: "0.7rem" }}>Knock-up 👆🏻</span>

                      {/* Tooltip */}
                      {showKnockTip && (
                        <div
                          style={{
                            position: "absolute",
                            top: "110%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#111",
                            border: "1px solid #555",
                            borderRadius: 4,
                            padding: "8px 12px",
                            fontSize: "0.8rem",
                            color: "#eee",

                            width: 320,              // ← Fixed width (NOT maxWidth)
                            maxWidth: "none",        // ← Prevents grid from shrinking it
                            whiteSpace: "normal",
                            lineHeight: 1.35,

                            zIndex: 9999,
                            pointerEvents: "auto",

                            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                          }}
                        >
                          Without mobility, to reach the top portal in Haunted Hill, you have to get a monster to hit you on to the platform.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Common routes */}
              <div
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.8rem",
                }}
              >
                <div style={{ marginBottom: "0.25rem" }}>Common routes:</div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {/* CWK */}
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoute("Haunted House", "Forgotten Path (T)")
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: "#111822",
                      color: "#eee",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      flexDirection: "column",
                      width: "23%",
                    }}
                  >
                    <img
                      src="/crimsonwood.png"
                      alt="CWK"
                      style={{
                        height: 20,
                        imageRendering: "pixelated",
                      }}
                    />
                    <span>Crimsonwood<br />Keep</span>
                  </button>

                  {/* Lucky Charm */}
                  <button
                    type="button"
                    onClick={() => handleQuickRoute("Haunted House", "Haunted Hill")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: "#111822",
                      color: "#eee",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      flexDirection: "column",
                      width: "23%",
                    }}
                  >
                    <img
                      src="https://maplelegends.com/static/images/lib/item/04032031.png"
                      alt="Lucky Charm"
                      style={{
                        height: 20,
                        imageRendering: "pixelated",
                      }}
                    />
                    <span>Lucky Charm</span>
                  </button>

                  {/* Soiled Rags */}
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoute("Haunted House", "Forgotten Path (T)")
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: "#111822",
                      color: "#eee",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      flexDirection: "column",
                      width: "23%",
                    }}
                  >
                    <img
                      src="https://maplelegends.com/static/images/lib/item/04032011.png"
                      alt="Soiled Rags"
                      style={{
                        height: 20,
                        imageRendering: "pixelated",
                      }}
                    />
                    <span>Soiled Rags</span>
                  </button>

                  {/* Reset */}
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickRoute("Haunted House", "Bent Tree")
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: "#111822",
                      color: "#eee",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      flexDirection: "column",
                      width: "23%",
                    }}
                  >
                    <img
                      src="reset.png"
                      alt="Reset"
                      style={{
                        height: 20,
                      }}
                    />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Dropdowns + route */}
              {isMobile ? (
                // MOBILE: each on its own row
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.95rem",
                    }}
                  >
                    Current map:
                    <select
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: "0.35rem 0.5rem",
                        fontSize: "1rem",
                      }}
                    >
                      {maps.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>

                  <div
                    style={{
                      textAlign: "center",
                    }}>
                    <button
                      type="button"
                      onClick={handleReverse}
                      style={{
                        padding: "0.4rem 0.9rem",
                        fontSize: "0.85rem",
                        borderRadius: 6,
                        border: "1px solid #555",
                        background: "#111822",
                        color: "#eee",
                        cursor: "pointer",
                        width: "100%",
                        maxWidth: "150px",
                      }}
                    >
                      ⇄<br />Reverse
                    </button>
                  </div>

                  <label
                    style={{
                      fontSize: "0.95rem",
                    }}
                  >
                    Destination:
                    <select
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: "0.35rem 0.5rem",
                        fontSize: "1rem",
                      }}
                    >
                      {maps.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                // DESKTOP: all three in one row
                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    gap: "0.75rem",
                    alignItems: "flex-end",
                    marginBottom: "0.4rem",
                  }}
                >
                  <label
                    style={{
                      flex: "1 1 0",
                      fontSize: "0.95rem",
                    }}
                  >
                    Current map:
                    <select
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: "0.35rem 0.5rem",
                        fontSize: "1rem",
                      }}
                    >
                      {maps.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>

                  <div
                    style={{
                      flex: "0 0 auto",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleReverse}
                      style={{
                        padding: "0.4rem 0.9rem",
                        marginTop: 4,
                        fontSize: "0.85rem",
                        borderRadius: 6,
                        border: "1px solid #555",
                        background: "#111822",
                        color: "#eee",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⇄
                    </button>
                  </div>

                  <label
                    style={{
                      flex: "1 1 0",
                      fontSize: "0.95rem",
                    }}
                  >
                    Destination:
                    <select
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        padding: "0.35rem 0.5rem",
                        fontSize: "1rem",
                      }}
                    >
                      {maps.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {renderResult()}
            </div>

            {/* RIGHT COLUMN: map + legend */}
            <div
              style={{
                flex: "1 1 480px",
                minWidth: 320,
                textAlign: "center",
              }}
            >
              <div
                onClick={() => setShowMapModal(true)}
                style={{ cursor: "zoom-in" }}
              >
                <img
                  src={MAP_GRAPHIC}
                  alt="Phantom Forest Map"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #444",
                    background: "#000",
                    imageRendering: "pixelated",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "0",
                  fontSize: "0.75rem",
                  opacity: 0.85,
                  textAlign: "right",
                }}
              >
                Original map credit:&nbsp;
                <a href="http://www.southperry.net/showthread.php?t=2347">
                  Stereo
                </a>&nbsp;
                Edited map credit:&nbsp;
                <a href="https://mapleroyals.com/forum/threads/phantom-forest-basic-navigation-for-clueless-people.126167/">
                  Gillies
                </a>
              </div>

              {/* Legend */}
              <table
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  fontSize: "0.75rem",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        border: "1px solid #333",
                      }}
                    >
                      Black arrow
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "left",
                        border: "1px solid #333",
                      }}
                    >
                      Two-way link
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        border: "1px solid #333",
                      }}
                    >
                      Coloured arrow
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "left",
                        border: "1px solid #333",
                      }}
                    >
                      One-way link
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        border: "1px solid #333",
                      }}
                    >
                      Highlighted arrow
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "left",
                        border: "1px solid #333",
                      }}
                    >
                      Popular route
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        border: "1px solid #333",
                      }}
                    >
                      <img
                        src={TOE_ICON}
                        alt="Toe icon"
                        style={{
                          height: 24,
                          imageRendering: "pixelated",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "left",
                        border: "1px solid #333",
                      }}
                    >
                      Bigfoot spawns here (about every 16 hours)
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "right",
                        border: "1px solid #333",
                      }}
                    >
                      <img
                        src={HORSEMAN_ICON}
                        alt="Jack'o Lantern icon"
                        style={{
                          height: 24,
                          imageRendering: "pixelated",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "3px 5px",
                        textAlign: "left",
                        border: "1px solid #333",
                      }}
                    >
                      Headless Horseman spawns here (about every 12 hours)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid #333",
              fontSize: "0.8rem",
              opacity: 0.85,
              textAlign: "center",
            }}
          >
            Made with love for&nbsp;
            <a
              href="https://maplelegends.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#9ad1ff", textDecoration: "underline" }}
            >
              MapleLegends
            </a>
            , but not affiliated. For feedback, please DM thsscapi on&nbsp;
            <a
              href="https://forum.maplelegends.com/index.php?conversations/add&to=thsscapi"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#9ad1ff", textDecoration: "underline" }}
            >
              ML forums.
            </a>
          </div>

        </div>
      </div>

      {/* Full-screen modal for map */}
      {showMapModal && (
        <div
          onClick={() => setShowMapModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "95vw",
              maxHeight: "95vh",
            }}
          >
            <img
              src={MAP_GRAPHIC}
              alt="Phantom Forest Map enlarged"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                imageRendering: "pixelated",
                display: "block",
              }}
            />
            <button
              onClick={() => setShowMapModal(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                border: "none",
                borderRadius: "999px",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
