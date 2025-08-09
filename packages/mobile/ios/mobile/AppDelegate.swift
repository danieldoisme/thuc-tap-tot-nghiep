import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "mobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    #if DEBUG
      return URL(string: "http://192.168.1.5:8081/index.bundle?platform=ios")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      return URL(string: "http://192.168.1.5:8081/index.bundle?platform=ios")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
