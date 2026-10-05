import { Component, type ReactNode } from "react";
export default class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="card" role="status"><p>The map is unavailable. Use the provider list for addresses and directions.</p><button type="button" className="text-action-link" onClick={() => this.setState({ failed: false })}>Retry map</button></div> : this.props.children;
  }
}
