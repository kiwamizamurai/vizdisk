import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { models } from '../../../wailsjs/go/models';
import { TreeMapTooltip } from './TreeMapTooltip';

describe('TreeMapTooltip', () => {
  const mockFileNode: models.FileNode = {
    id: '1',
    name: 'test.txt',
    path: '/path/test.txt',
    size: 1024,
    type: 'file',
    lastModified: '2024-01-01T00:00:00Z',
    isHidden: false,
  } as models.FileNode;

  const mockDirNode: models.FileNode = {
    id: '2',
    name: 'testdir',
    path: '/path/testdir',
    size: 4096,
    type: 'directory',
    lastModified: '2024-01-01T00:00:00Z',
    isHidden: false,
  } as models.FileNode;

  it('should not render when not visible', () => {
    const { container } = render(
      <TreeMapTooltip
        visible={false}
        x={100}
        y={100}
        data={{
          name: 'test.txt',
          size: 1024,
          originalNode: mockFileNode,
        }}
        parentSize={10000}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when data is undefined', () => {
    const { container } = render(
      <TreeMapTooltip visible={true} x={100} y={100} data={undefined} parentSize={10000} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render file tooltip with correct information', () => {
    render(
      <TreeMapTooltip
        visible={true}
        x={100}
        y={100}
        data={{
          name: 'test.txt',
          size: 1024,
          originalNode: mockFileNode,
        }}
        parentSize={10000}
      />
    );

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('1.00 KB')).toBeInTheDocument();
    expect(screen.getByText('10.2%')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
  });

  it('should render directory tooltip with folder icon', () => {
    render(
      <TreeMapTooltip
        visible={true}
        x={100}
        y={100}
        data={{
          name: 'testdir',
          size: 4096,
          originalNode: mockDirNode,
        }}
        parentSize={10000}
      />
    );

    expect(screen.getByText('testdir')).toBeInTheDocument();
    expect(screen.getByText('4.00 KB')).toBeInTheDocument();
  });

  it('should position tooltip correctly', () => {
    const { container } = render(
      <TreeMapTooltip
        visible={true}
        x={200}
        y={150}
        data={{
          name: 'test.txt',
          size: 1024,
          originalNode: mockFileNode,
        }}
        parentSize={10000}
      />
    );

    const tooltipElement = container.firstChild as HTMLElement;
    expect(tooltipElement.style.left).toBe('200px');
    expect(tooltipElement.style.top).toBe('150px');
  });
});
