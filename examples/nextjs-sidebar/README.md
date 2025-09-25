# Dynamic Sidebar Widget Demo

This project demonstrates the integration of Dynamic's new Sidebar Widget, a user-friendly authentication solution that can be set up in just a minute.

## Features

- Easy integration with Dynamic's SDK
- Elegant user interface
- Seamless authentication flow
- Responsive design

## Getting Started

1. Install the necessary dependencies:
   ```
   npm install @dynamic-labs/sdk-react-core
   ```

2. Wrap your application with the `DynamicContextProvider` (not shown in the current file).

3. Use the `ClientWrapper` component to conditionally render the Dynamic Widget or a login button.

## Usage

The `ClientWrapper` component uses Dynamic's context to manage authentication state:

- If a user is logged in, it displays the Dynamic Widget.
- If no user is logged in, it shows a button to initiate the authentication flow.

## Customization

The component uses Tailwind CSS classes for styling, allowing for easy customization of the appearance.

For more information about Dynamic's Sidebar Widget, please refer to the [official documentation](https://docs.dynamic.xyz/).