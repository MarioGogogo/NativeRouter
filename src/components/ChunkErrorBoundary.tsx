import React, { Component, ReactNode } from 'react';
import { ScriptManager } from '@callstack/repack/client';
import ErrorScreen from '../screens/ErrorScreen';

interface Props {
  children: ReactNode;
  onGoBack: () => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChunkErrorBoundary] Failed to load chunk:', error);
  }

  handleRetry = async () => {
    console.log('[ChunkErrorBoundary] Retrying download...');

    // 清除脚本缓存，强制重新下载
    await ScriptManager.shared.invalidateScripts([]);

    // 如果父组件提供了 onRetry，调用它（让父组件决定是否强制重新挂载）
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      // 否则只重置错误状态
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error || undefined}
          onRetry={this.handleRetry}
          onGoBack={this.props.onGoBack}
        />
      );
    }

    return this.props.children;
  }
}
