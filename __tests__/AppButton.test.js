import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AppButton from '../src/components/AppButton';

describe('AppButton Component Tests', () => {
  test('renders primary variant with default styles', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <AppButton label="Save Changes" variant="primary" />
      );
    });

    const root = renderer.root;
    const pressable = root.findByProps({ accessibilityRole: 'button' });
    const text = root.findByProps({ children: 'Save Changes' });

    // In React Native, style can be evaluated from style function or array
    const styleProp = typeof pressable.props.style === 'function' 
      ? pressable.props.style({ pressed: false }) 
      : pressable.props.style;
    const flatStyle = Array.isArray(styleProp) ? Object.assign({}, ...styleProp) : styleProp;

    expect(flatStyle.backgroundColor).toBe('#166534');
    expect(flatStyle.height).toBe(54); // Default lg
    expect(flatStyle.borderRadius).toBe(14);
    expect(flatStyle.width).toBe('100%'); // fullWidth default true

    const textStyle = Array.isArray(text.props.style) 
      ? Object.assign({}, ...text.props.style) 
      : text.props.style;
    expect(textStyle.color).toBe('#FFFFFF');
  });

  test('renders danger variant with red styling and border', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <AppButton label="Delete Account" variant="danger" size="md" />
      );
    });

    const root = renderer.root;
    const pressable = root.findByProps({ accessibilityRole: 'button' });
    const text = root.findByProps({ children: 'Delete Account' });

    const styleProp = typeof pressable.props.style === 'function' 
      ? pressable.props.style({ pressed: false }) 
      : pressable.props.style;
    const flatStyle = Array.isArray(styleProp) ? Object.assign({}, ...styleProp) : styleProp;

    expect(flatStyle.backgroundColor).toBe('#FEF2F2');
    expect(flatStyle.borderColor).toBe('#FCA5A5');
    expect(flatStyle.height).toBe(48); // md height

    const textStyle = Array.isArray(text.props.style) 
      ? Object.assign({}, ...text.props.style) 
      : text.props.style;
    expect(textStyle.color).toBe('#DC2626');
  });

  test('renders outline and subtle variants properly', () => {
    let rendererOutline;
    ReactTestRenderer.act(() => {
      rendererOutline = ReactTestRenderer.create(
        <AppButton label="Cancel" variant="outline" />
      );
    });
    const outlineRoot = rendererOutline.root;
    const outlinePressable = outlineRoot.findByProps({ accessibilityRole: 'button' });
    const outlineStyle = typeof outlinePressable.props.style === 'function'
      ? outlinePressable.props.style({ pressed: false })
      : outlinePressable.props.style;
    const flatOutline = Array.isArray(outlineStyle) ? Object.assign({}, ...outlineStyle) : outlineStyle;
    expect(flatOutline.backgroundColor).toBe('#FFFFFF');
    expect(flatOutline.borderColor).toBe('#166534');

    let rendererSubtle;
    ReactTestRenderer.act(() => {
      rendererSubtle = ReactTestRenderer.create(
        <AppButton label="Details" variant="subtle" size="sm" />
      );
    });
    const subtleRoot = rendererSubtle.root;
    const subtlePressable = subtleRoot.findByProps({ accessibilityRole: 'button' });
    const subtleStyle = typeof subtlePressable.props.style === 'function'
      ? subtlePressable.props.style({ pressed: false })
      : subtlePressable.props.style;
    const flatSubtle = Array.isArray(subtleStyle) ? Object.assign({}, ...subtleStyle) : subtleStyle;
    expect(flatSubtle.backgroundColor).toBe('#FFFFFF');
    expect(flatSubtle.borderColor).toBe('#E2E8F0');
    expect(flatSubtle.height).toBe(40);
  });

  test('handles title, label, buttonText, and children fallbacks gracefully', () => {
    let r1, r2, r3;
    ReactTestRenderer.act(() => {
      r1 = ReactTestRenderer.create(<AppButton title="Title Prop" />);
      r2 = ReactTestRenderer.create(<AppButton buttonText="ButtonText Prop" />);
      r3 = ReactTestRenderer.create(<AppButton>Children Text</AppButton>);
    });

    expect(r1.root.findByProps({ children: 'Title Prop' })).toBeTruthy();
    expect(r2.root.findByProps({ children: 'ButtonText Prop' })).toBeTruthy();
    expect(r3.root.findByProps({ children: 'Children Text' })).toBeTruthy();
  });

  test('renders loading ActivityIndicator when loading=true', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <AppButton label="Submitting" loading={true} />
      );
    });
    const root = renderer.root;
    const indicator = root.findByType('ActivityIndicator');
    expect(indicator).toBeTruthy();
    expect(indicator.props.color).toBe('#FFFFFF');
  });

  test('applies disabled opacity and accessibility state when disabled=true', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <AppButton label="Disabled Button" disabled={true} />
      );
    });
    const root = renderer.root;
    const pressable = root.findByProps({ accessibilityRole: 'button' });
    expect(pressable.props.disabled).toBe(true);
    expect(pressable.props.accessibilityState.disabled).toBe(true);

    const styleProp = typeof pressable.props.style === 'function' 
      ? pressable.props.style({ pressed: false }) 
      : pressable.props.style;
    const flatStyle = Array.isArray(styleProp) ? Object.assign({}, ...styleProp) : styleProp;
    expect(flatStyle.opacity).toBe(0.6);
  });
});
