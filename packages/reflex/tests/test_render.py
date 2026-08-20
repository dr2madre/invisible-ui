"""Render smoke tests for the Reflex wrappers.

These run without Node or a browser: they assert that each wrapper compiles to
the right React tag with the right (camelCased) props, event triggers and
imports — i.e. that the Python layer will hand the React adapter exactly what
its test suite already proves correct. Real behaviour is covered by the React
package's own 89 tests; a full Reflex app run stays a manual smoke check
(see examples/reflex).
"""

import reflex as rx

import invisible_ui as ui

# A minimal valid handler for wiring tests (plain lambdas are not EventSpecs).
LOG = rx.console_log("event")


def props_of(component) -> str:
    return " ".join(component.render()["props"])


def test_button_renders_tag_props_and_children():
    c = ui.button("Save", variant="primary", disabled=True, button_type="submit")
    r = c.render()
    assert r["name"] == "Button"
    p = props_of(c)
    assert 'variant:"primary"' in p
    assert "disabled:true" in p
    # `button_type` reaches React as its real prop name.
    assert 'type:"submit"' in p and "buttonType" not in p
    assert r["children"][0]["contents"] == '"Save"'


def test_button_press_is_wired_without_args():
    c = ui.button("Save", on_press=LOG)
    assert any(prop.startswith("onPress:") for prop in c.render()["props"])


def test_checkbox_tristate_and_form_props():
    c = ui.checkbox(
        label="Subscribe",
        checked="indeterminate",
        name="news",
        value="weekly",
        required=True,
        on_checked_change=LOG,
    )
    r = c.render()
    assert r["name"] == "Checkbox"
    p = props_of(c)
    assert 'label:"Subscribe"' in p
    assert 'checked:"indeterminate"' in p
    assert 'name:"news"' in p and 'value:"weekly"' in p and "required:true" in p
    assert any(prop.startswith("onCheckedChange:") for prop in r["props"])


def test_switch_on_off_variant():
    c = ui.switch(label="Notifications", on_off=True, on_text="YES", off_text="NO")
    p = props_of(c)
    assert c.render()["name"] == "Switch"
    assert "onOff:true" in p and 'onText:"YES"' in p and 'offText:"NO"' in p


def test_select_items_and_invalid_state():
    c = ui.select(
        label="Fruit",
        items=[{"value": "apple", "label": "Apple"}, {"value": "fig", "disabled": True}],
        width="fill",
        error="Pick a fruit",
        on_value_change=LOG,
    )
    r = c.render()
    assert r["name"] == "Select"
    p = props_of(c)
    # Items render as a JS object literal: ({ ["value"] : "apple", … }).
    assert '["value"]:"apple"' in p.replace(" ", "")
    assert 'width:"fill"' in p and 'error:"Pick a fruit"' in p
    assert any(prop.startswith("onValueChange:") for prop in r["props"])


def test_combobox_select_only_mode():
    c = ui.combobox(
        label="Priority",
        items=[{"value": "high", "label": "High", "icon": "M12 19V5"}],
        searchable=False,
        on_input_value_change=LOG,
    )
    r = c.render()
    assert r["name"] == "Combobox"
    assert "searchable:false" in props_of(c)
    assert any(prop.startswith("onInputValueChange:") for prop in r["props"])


def test_dialog_props_are_camel_cased():
    c = ui.dialog(
        "Body",
        title="Share this file",
        trigger="Share",
        hide_title=False,
        footer_close=True,
        initial_focus=".target",
        close_on_outside_click=False,
        on_open_change=LOG,
    )
    r = c.render()
    assert r["name"] == "Dialog"
    p = props_of(c)
    assert 'title:"Share this file"' in p and 'trigger:"Share"' in p
    assert "footerClose:true" in p
    assert 'initialFocus:".target"' in p
    assert "closeOnOutsideClick:false" in p


def test_dialog_body_layout_reaches_react():
    c = ui.dialog("Body", title="Set up project", body_layout="stack")
    assert 'bodyLayout:"stack"' in props_of(c)


def test_dialog_composition_regions_compile_to_jsx_props():
    """Reflex compiles a component-valued prop to a JSX element, so the
    workflow regions reach the React adapter as real nodes."""
    c = ui.dialog(
        "Body",
        title="Set up project",
        body_layout="stack",
        header_meta=rx.text("Step 2 of 2"),
        footer_lead=ui.button("Back", variant="ghost"),
        footer=ui.button("Create project", variant="primary"),
    )
    p = props_of(c)
    assert "headerMeta:(jsx(" in p and "Step 2 of 2" in p
    assert "footerLead:(jsx(" in p and "Back" in p
    assert "footer:(jsx(" in p and "Create project" in p


def test_multi_select_renders_tag_props_and_triggers():
    c = ui.multi_select(
        label="Skills",
        items=[{"value": "vue", "label": "Vue"}],
        values=["vue"],
        max=3,
        remove_on_backspace=True,
        read_only=False,
        name="skills",
        required=True,
        on_values_change=LOG,
        on_input_value_change=LOG,
    )
    r = c.render()
    assert r["name"] == "MultiSelect"
    p = props_of(c)
    assert 'label:"Skills"' in p
    assert 'values:["vue"]' in p
    assert "max:3" in p
    # snake_case props reach React camelCased.
    assert "removeOnBackspace:true" in p
    assert "readOnly:false" in p
    assert "required:true" in p
    assert 'name:"skills"' in p
    assert "onValuesChange" in p
    assert "onInputValueChange" in p


def test_every_wrapper_imports_the_react_package_and_stylesheet():
    for factory in (
        ui.button,
        ui.checkbox,
        ui.switch,
        ui.select,
        ui.combobox,
        ui.multi_select,
        ui.dialog,
    ):
        c = factory(label="x", title="x", items=[]) if factory is not ui.button else factory("x")
        imports = c._get_all_imports()
        assert "@design-system/react" in imports
        bare = [str(v.tag) for v in imports.get("", [])]
        assert "@design-system/react/styles.css" in bare
