import React, { Component } from "react";
import { View, Text, ScrollView, TouchableHighlight, TextInput, StyleSheet, Dimensions, Image, Alert, CheckBox, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import PropTypes from 'prop-types';

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Synchronization from "../services/Synchronization";

import PosStorage from "../database/PosStorage";
import * as SettingsActions from "../actions/SettingsActions";
import * as ToolbarActions from "../actions/ToolBarActions";
import * as CustomerActions from "../actions/CustomerActions";
import * as receiptActions from "../actions/ReceiptActions";
import * as waterOpActions from "../actions/WaterOpActions";
import ModalDropdown from 'react-native-modal-dropdown';

import Events from "react-native-simple-events";

import Communications from '../services/Communications';
import i18n from '../app/i18n';

const { height, width } = Dimensions.get('window');
const inputFontHeight = Math.round((24 * height) / 752);
const marginTextInput = Math.round((5 * height) / 752);
const marginSpacing = Math.round((20 * height) / 752);
const inputTextWidth = 400;
const marginInputItems = width / 2 - inputTextWidth / 2;

const supportedUILanguages = [
	{ name: 'English', iso_code: 'en' },
	{ name: 'Français', iso_code: 'fr' },
	{ name: 'Kreyòl Ayisyen', iso_code: 'ht' }
];

class SettingsProperty extends Component {
	constructor(props) {
		super(props);
		this.state = {
			propertyText: this.props.valueFn()
		};

	}


	render() {
		return (
			<View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', marginTop: this.props.marginTop, alignSelf: 'flex-end', marginRight: marginInputItems }}>
				<View>
					<Text style={styles.labelText}>{this.props.label}</Text>
				</View>
				<View style={[styles.inputContainer]}>
					<TextInput
						style={[styles.inputText,]}
						underlineColorAndroid='transparent'
						placeholder={this.props.placeHolder}
						value={this.state.propertyText}
						secureTextEntry={this.props.isSecure}
						onChangeText={this.onChangeText.bind(this)} />
				</View>
			</View>
		);
	}
	onChangeText = (text) => {
		this.setState({ propertyText: text });
		this.props.parent.forceUpdate();
	}
}

class SettingsButton extends Component {

	render() {
		return (
			<View style={[styles.submit, { marginLeft: 30 }, this.getOpacity()]}>
				<View style={[{ justifyContent: 'center', height: 60, alignItems: 'center' }]}>
					{this.showEnabled()}
				</View>
			</View>
		);
	}
	getOpacity() {
		return (this.props.enableFn()) ? { opacity: 1 } : { opacity: .7 };
	}
	showEnabled() {
		if (this.props.enableFn()) {
			console.log("Enabled - " + this.props.label);
			return (
				<TouchableHighlight underlayColor='#c0c0c0'
					onPress={() => this.props.pressFn()}>
					<Text style={[styles.buttonText]}>{this.props.label}</Text>
				</TouchableHighlight>
			)
		} else {
			console.log("Disabled - " + this.props.label);
			return (<Text style={[styles.buttonText]}>{this.props.label}</Text>);
		}
	}
}

class Settings extends Component {
	constructor(props) {
		super(props);
		this.url = React.createRef();
		this.site = React.createRef();
		this.user = React.createRef();
		this.supportedLanguages = React.createRef();
		this.password = React.createRef();
		this.state = {
			animating: false,
			selectedLanguage: {}
		};

		this.onShowLanguages = this.onShowLanguages.bind(this);
		this.onLanguageSelected = this.onLanguageSelected.bind(this);
		this.onSaveSettings = this.onSaveSettings.bind(this);
	}

	componentDidMount() {
		console.log("Settings:Mounted");
	}

	render() {
		return (
			<ScrollView style={{ flex: 1 }}>
				<View style={{ flexDirection: 'row' }}>

					<View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', height: 100 }}>
						<Text style={[styles.headerText]}>{i18n.t('settings')}</Text>
					</View>
					<View style={{ flexDirection: 'row-reverse', flex: 1, alignItems: 'center', height: 100 }}>
						{this.getSettingsCancel()}
					</View>
				</View>

				<KeyboardAwareScrollView
					style={{ flex: 1 }}
					resetScrollToCoords={{ x: 0, y: 0 }}
					contentContainerStyle={{flex: 1}}
					scrollEnabled={false}>
					<View style={{ flex: 1, alignItems: 'center' }}>
						<SettingsProperty
							parent={this}
							marginTop={10}
							placeHolder={i18n.t('service-url-placeholder')}
							label={i18n.t('service-url-label')}
							isSecure={false}
							valueFn={this.getUrl.bind(this)}
							ref={this.url} />
						<SettingsProperty
							parent={this}
							marginTop={marginSpacing}
							placeHolder={i18n.t('site-placeholder')}
							isSecure={false}
							label={i18n.t('site-label')}
							valueFn={this.getSite.bind(this)}
							ref={this.site} />
						<SettingsProperty
							parent={this}
							marginTop={marginSpacing}
							placeHolder={i18n.t('username-or-email-placeholder')}
							label={i18n.t('username-or-email-placeholder')}
							isSecure={false}
							valueFn={this.getUser.bind(this)}
							ref={this.user} />
						<SettingsProperty
							parent={this}
							marginTop={marginSpacing}
							placeHolder={i18n.t('password-placeholder')}
							label={i18n.t('password-label')}
							isSecure={true}
							valueFn={this.getPassword.bind(this)}
							ref={this.password} />

						<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
							<ModalDropdown
								style={{ width: 250 }}
								textStyle={styles.dropdownText}
								dropdownTextStyle={[styles.dropdownText, { width: 250 }]}
								dropdownStyle={{ borderColor: 'black', borderWidth: 2 }}
								ref={this.supportedLanguages}
								defaultValue={this.getDefaultUILanguage()}
								defaultIndex={this.getDefaultUILanguageIndex()}
								options={supportedUILanguages.map(lang => lang.name)}
								onSelect={this.onLanguageSelected}
							/>
							<TouchableHighlight underlayColor='#c0c0c0'
								onPress={this.onShowLanguages}>
								<Text style={{ fontSize: 40 }}>{"\u2B07"}</Text>
							</TouchableHighlight>
						</View>

						<View style={{ flexDirection: 'row', flex: 1, alignItems: 'center'}}>
							<SettingsButton
								pressFn={this.onSaveSettings}
								enableFn={this.enableSaveSettings.bind(this)}
								label={i18n.t('save-settings')} />
							<SettingsButton
								pressFn={this.onConnection.bind(this)}
								enableFn={this.enableConnectionOrSync.bind(this)}
								label={i18n.t('connect')} />
							<SettingsButton
								pressFn={this.onClearAll.bind(this)}
								enableFn={this.enableClearAll.bind(this)}
								label={i18n.t('clear')} />
							<SettingsButton
								pressFn={this.onSynchronize.bind(this)}
								enableFn={this.enableConnectionOrSync.bind(this)}
								label={i18n.t('sync-now')} />
						</View>
					</View>

				</KeyboardAwareScrollView>
				{this.state.animating &&
					<View style={styles.activityIndicator}>
						<ActivityIndicator size='large' />
					</View>
				}
			</ScrollView>

		);
	}
	getSettingsCancel() {
		if (PosStorage.getCustomerTypes().length > 0) {
			return (
				<TouchableHighlight
					onPress={() => this.onCancelSettings()}>
					<Image source={require('../images/icons8-cancel-50.png')} style={{ marginRight: 100 }} />
				</TouchableHighlight>

			)
		} else {
			return null;
		}
	}

	getUrl() {
		return this.props.settings.semaUrl;
	}

	getUser() {
		return this.props.settings.user;
	}

	getPassword() {
		return this.props.settings.password;
	}

	getSite() {
		return this.props.settings.site;
	}

	onCancelSettings() {
		this.props.toolbarActions.ShowScreen("main");
	}

	onShowLanguages() {
		this.supportedLanguages.current.show();
	}

	closeHandler() {
		this.onCancelSettings();
	};

	onSaveSettings() {

		// TODO - Validate fields and set focus to invalid field;
		this.saveSettings(this.props.settings.token, this.props.settings.siteId, this.props.settings.unitSystem);
	};

	enableSaveSettings() {
		return true;
	}
	onSynchronize() {
		Synchronization.synchronize()
			.then(syncResult => {
				console.log("Synchronization-result: " + JSON.stringify(syncResult));
				// let foo = this._getSyncResults(syncResult);
				Alert.alert(
					i18n.t('sync-results'),
					this._getSyncResults(syncResult), [{ text: i18n.t('ok'), style: 'cancel' },], { cancelable: true }
				);
			});
	}
	_getSyncResults(syncResult) {
		if (syncResult.status != "success") return i18n.t('sync-error', { error: syncResult.error });
		if (syncResult.hasOwnProperty("customers") && syncResult.customers.error != null) return i18n.t('sync-error', { error: syncResult.customers.error });
		if (syncResult.hasOwnProperty("products") && syncResult.products.error != null) return i18n.t('sync-error', { error: syncResult.products.error });
		if (syncResult.hasOwnProperty("sales") && syncResult.sales.error != null) return i18n.t('sync-error', { error: syncResult.sales.error });
		if (syncResult.hasOwnProperty("productMrps") && syncResult.productMrps.error != null) return i18n.t('sync-error', { error: syncResult.productMrps.error });

		else {
			if (syncResult.customers.localCustomers == 0 && syncResult.customers.remoteCustomers == 0 &&
				syncResult.products.remoteProducts == 0 && syncResult.sales.localReceipts == 0 &&
				syncResult.productMrps.remoteProductMrps == 0) {
				return i18n.t('data-is-up-to-date');
			} else {
				return `${syncResult.customers.localCustomers + syncResult.customers.remoteCustomers} ${i18n.t('customers-updated')}
${syncResult.products.remoteProducts} ${i18n.t('products-updated')}
${syncResult.sales.localReceipts} ${i18n.t('sales-receipts-updated')}
${syncResult.productMrps.remoteProductMrps} ${i18n.t('product-sales-channel-prices-updated')}`;
			}
		}
	}
	onClearAll() {
		console.log("Settings:onClearAll");
		let alertMessage = i18n.t('clear-all-data');
		Alert.alert(
			alertMessage,
			i18n.t('are-you-sure', { doThat: i18n.t('delete-all-data') }),
			[
				{ text: i18n.t('no'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
				{
					text: i18n.t('yes'), onPress: () => {
						this._clearDataAndSync();
						this.closeHandler();

					}
				},
			],
			{ cancelable: false }
		);

	}
	enableClearAll() {
		return true;
	}
	_clearDataAndSync() {
		PosStorage.clearDataOnly();
		this.props.settingsActions.setSettings(PosStorage.getSettings());
		this.props.customerActions.setCustomers(PosStorage.getCustomers());
		this.props.waterOpActions.setWaterOpConfigs(PosStorage.getWaterOpConfigs());
		this.props.receiptActions.setRemoteReceipts(PosStorage.getRemoteReceipts());
		const saveConnected = Synchronization.isConnected;
		Synchronization.initialize(
			PosStorage.getLastCustomerSync(),
			PosStorage.getLastProductSync(),
			PosStorage.getLastSalesSync());
		Synchronization.setConnected(saveConnected);

	};

	onConnection() {
		this.setState({ animating: true });
		Communications.initialize(
			this.url.current.state.propertyText,
			this.site.current.state.propertyText,
			this.user.current.state.propertyText,
			this.password.current.state.propertyText);
		try {
			let message = i18n.t('successful-connection');
			Communications.login()
				.then(result => {
					console.log("Passed - status" + result.status + " " + JSON.stringify(result.response));
					if (result.status === 200) {
						Communications.getSiteId(result.response.token, this.site.current.state.propertyText)
							.then(async siteId => {
								if (siteId === -1) {
									message = i18n.t('successful-connection-but', { what: this.site.current.state.propertyText, happened: i18n.t('does-not-exist') });
								} else if (siteId === -2) {
									message = i18n.t('successful-connection-but', { what: this.site.current.state.propertyText, happened: i18n.t('is-not-active') })
								} else {
									this.saveSettings(result.response.token, siteId, result.response.unitSystem);
									Communications.setToken(result.response.token);
									Communications.setSiteId(siteId);
									PosStorage.setTokenExpiration();
									await Synchronization.synchronizeSalesChannels();
									Synchronization.scheduleSync();
									// PosStorage.saveConfiguration( result.response.token, siteId );
									// this.props.settingsActions.setConfiguration(PosStorage.getConfiguration());
								}
								this.setState({ animating: false });
								Alert.alert(
									i18n.t('network-connection'),
									message, [{ text: i18n.t('ok'), style: 'cancel' },], { cancelable: true }
								);
								if (siteId !== -1 && siteId !== -2) {
									this.closeHandler();
								}
							});

					} else {
						this.setState({ animating: false });
						message = result.response.msg + "(Error code: " + result.status + ")";
						Alert.alert(
							i18n.t('network-connection'),
							message, [{ text: i18n.t('ok'), style: 'cancel' },], { cancelable: true }
						);
					}
				})
				.catch(result => {
					console.log("Failed- status " + result.status + " " + result.response.message);
					this.setState({ animating: false });
					Alert.alert(
						i18n.t('network-connection'),
						result.response.message + ". (" + result.status + ")", [{ text: i18n.t('ok'), style: 'cancel' },], { cancelable: true }
					);
				})
		} catch (error) {
			this.setState({ animating: false });
			console.log(JSON.stringify(error));
		}
	}
	enableConnectionOrSync() {
		let url = (this.url.current) ? this.url.current.state.propertyText : this.getUrl();
		let site = (this.site.current) ? this.site.current.state.propertyText : this.getSite();
		let user = (this.url.current) ? this.user.current.state.propertyText : this.getUser();
		let password = (this.password.current) ? this.password.current.state.propertyText : this.getPassword();

		if (url.length > 0 && site.length > 0 && user.length > 0 && password.length > 0) {
			return true;
		} else {
			return false;
		}
	}

	saveSettings(token, siteId, unitSystem) {
		// Check to see if the site has changed
		let currentSettings = PosStorage.getSettings();
		if (currentSettings.siteId != siteId) {
			// New site - clear all data
			this._clearDataAndSync();
		}

		PosStorage.saveSettings(this.url.current.state.propertyText,
			this.site.current.state.propertyText,
			this.user.current.state.propertyText,
			this.password.current.state.propertyText,
			this.state.selectedLanguage,
			token,
			siteId,
			unitSystem);
		this.props.settingsActions.setSettings(PosStorage.getSettings());
	}

	getDefaultUILanguage() {
		console.log(`CURRENT UI LANGUAGE IS ${this.props.settings.uiLanguage.name}`);
		return this.props.settings.uiLanguage.name;
	}

	getDefaultUILanguageIndex() {
		let langIdx = 0;
		supportedUILanguages.forEach((lang, idx) => {
			if (lang.name === this.props.settings.uiLanguage.name) {
				langIdx = idx;
			}
		});
		return langIdx;
	}

	onLanguageSelected(langIdx) {
		this.setState({
			selectedLanguage: supportedUILanguages.filter((lang, idx) => idx === Number(langIdx))[0]
		}, () => {
			console.log(`Selected language is ${this.state.selectedLanguage.name}`);
			i18n.locale = this.state.selectedLanguage.iso_code;
			Events.trigger('SalesChannelsUpdated', {});
			this.onSaveSettings();
		});
	}

}

Settings.propTypes = {
	settings: PropTypes.object.isRequired,
	settingsActions: PropTypes.object.isRequired,
	customerActions: PropTypes.object.isRequired
};


function mapStateToProps(state, props) {
	return { settings: state.settingsReducer.settings };
}
function mapDispatchToProps(dispatch) {
	return {
		toolbarActions: bindActionCreators(ToolbarActions, dispatch),
		settingsActions: bindActionCreators(SettingsActions, dispatch),
		customerActions: bindActionCreators(CustomerActions, dispatch),
		receiptActions: bindActionCreators(receiptActions, dispatch),
		waterOpActions: bindActionCreators(waterOpActions, dispatch),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);

const styles = StyleSheet.create({
	headerText: {
		fontSize: 24,
		color: 'black',
		marginLeft: 100
	},
	submit: {
		backgroundColor: "#2858a7",
		borderRadius: 20
	},
	inputContainer: {
		borderWidth: 2,
		borderRadius: 10,
		borderColor: "#2858a7",
		backgroundColor: 'white'
	},
	buttonText: {
		fontWeight: 'bold',
		fontSize: 24,
		color: 'white',
		textAlign: 'center',
		// paddingTop:10,
		paddingLeft: 30,
		paddingRight: 30
		// paddingBottom:10
	},
	inputText: {
		fontSize: inputFontHeight,
		alignSelf: 'center',
		backgroundColor: 'white',
		width: inputTextWidth,
		margin: marginTextInput

	},
	labelText: {
		fontSize: inputFontHeight,
		alignSelf: 'flex-end',
		marginRight: 20

	},

	dropdownText: {
		fontSize: 24,
	},

	updating: {
		height: 100,
		width: 500,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ABC1DE',
		borderColor: "#2858a7",
		borderWidth: 5,
		borderRadius: 10
	},
	checkLabel: {
		left: 20,
		fontSize: 24,
	},
	activityIndicator: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	}
});


